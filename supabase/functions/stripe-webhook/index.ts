import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@^22";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  UUID,
  sid,
  syncSub,
  endSub,
  syncInvoice
} from "./billing.ts";


const EVENTS = new Set([
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "invoice.paid",
  "invoice.payment_failed"
]);


Deno.serve(async (req: Request) => {

  if (req.method !== "POST") {
    return new Response(
      "Method not allowed",
      { status: 405 }
    );
  }


  const key = Deno.env.get("STRIPE_SECRET_KEY");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const role = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");


  if (!key || !secret || !url || !role) {
    return new Response(
      "Internal configuration missing",
      { status: 500 }
    );
  }


  const signature =
    req.headers.get("stripe-signature");

  const raw =
    await req.text();


  if (!signature) {
    return new Response(
      "Missing signature",
      { status: 400 }
    );
  }


  const stripe =
    new Stripe(key);


  let event: any;


  try {

    event =
      await stripe.webhooks.constructEventAsync(
        raw,
        signature,
        secret,
        undefined,
        Stripe.createSubtleCryptoProvider()
      );

  } catch (error) {

    console.error(
      "Invalid Stripe signature",
      error
    );

    return new Response(
      "Invalid signature",
      { status: 400 }
    );
  }


  if (!EVENTS.has(event.type)) {

    return Response.json({
      received: true,
      ignored: true
    });

  }


  const db =
    createClient(
      url,
      role,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false
        }
      }
    );


  let started = false;


  try {


    const object: any =
      event.data.object;


    const {
      data: state,
      error: beginError
    } =
      await db.rpc(
        "begin_stripe_webhook_event",
        {
          event_id_value: event.id,
          event_type_value: event.type,
          payload_value: {
            id: event.id,
            type: event.type,
            object_id: object?.id || null,
            livemode: event.livemode
          }
        }
      );


    if (beginError) {
      throw new Error(beginError.message);
    }


    if (
      state === "processed" ||
      state === "processing"
    ) {

      return Response.json({
        received: true,
        duplicate: true,
        status: state
      });

    }


    started = true;


    let result: any = null;



    if (
      event.type === "checkout.session.completed" ||
      event.type === "checkout.session.async_payment_succeeded"
    ) {


      const session: any = object;

      const action =
        session.metadata?.action_type;


      const credit =
        session.mode === "payment" &&
        action === "credit_pack";


      const subscription =
        event.type === "checkout.session.completed" &&
        session.mode === "subscription" &&
        action === "subscription";



      if (!credit && !subscription) {

        result = {
          ignored: true
        };


      } else if (
        credit &&
        event.type === "checkout.session.completed" &&
        session.payment_status !== "paid"
      ) {

        result = {
          awaiting_payment: true
        };


      } else {


        const workspace =
          session.metadata?.workspace_id ||
          session.client_reference_id;


        if (
          !workspace ||
          !UUID.test(workspace)
        ) {

          throw new Error(
            "Invalid workspace metadata"
          );

        }



        if (credit) {


          const code =
            session.metadata?.code;


          const payment =
            sid(session.payment_intent) ||
            session.id;



          const {
            data: pack,
            error: packError
          } =
            await db
              .from("ai_credit_packs")
              .select("code,credits")
              .eq("code", code)
              .eq("is_active", true)
              .maybeSingle();



          if (packError || !pack) {

            throw new Error(
              packError?.message ||
              "Credit pack not found"
            );

          }



          const {
            data,
            error
          } =
            await db.rpc(
              "grant_ai_credits",
              {
                workspace_id_value: workspace,
                credits_value: Number(pack.credits),
                pack_code_value: String(pack.code),
                provider_value: "stripe",
                external_payment_id_value: payment,
                metadata_value: {
                  stripe_event_id: event.id,
                  stripe_checkout_session_id: session.id,
                  stripe_payment_intent_id: payment,
                  amount_total: session.amount_total,
                  currency: session.currency,
                  payment_status: session.payment_status
                }
              }
            );



          if (error) {
            throw new Error(error.message);
          }


          result = data;



        } else {


          const subId =
            sid(session.subscription);


          if (!subId) {
            throw new Error(
              "Subscription id missing"
            );
          }



          const sub =
            await stripe.subscriptions.retrieve(
              subId
            );


          result =
            await syncSub(
              db,
              sub,
              event.id,
              {
                stripe_checkout_session_id:
                  session.id,

                payment_status:
                  session.payment_status
              }
            );

        }

      }



    } else if (
      event.type === "customer.subscription.updated"
    ) {


      result =
        await syncSub(
          db,
          object,
          event.id
        );



    } else if (
      event.type === "customer.subscription.deleted"
    ) {


      result =
        await endSub(
          db,
          object,
          event.id
        );



    } else if (
      event.type === "invoice.paid"
    ) {
      result =
        await syncInvoice(
          db,
          stripe,
          object,
          event.id,
          event.type
        );

    } else if (
      event.type === "invoice.payment_failed"
    ) {
      result =
        await syncInvoice(
          db,
          stripe,
          object,
          event.id,
          event.type
        );
    }



    const {
      error: doneError
    } =
      await db.rpc(
        "complete_stripe_webhook_event",
        {
          event_id_value: event.id
        }
      );


    if (doneError) {
      throw new Error(doneError.message);
    }


    console.log(
      "Stripe event processed",
      event.type,
      event.id
    );


    return Response.json({
      received: true,
      result
    });



  } catch (error) {


    const message =
      error instanceof Error
        ? error.message
        : "Webhook processing failed";


    console.error(
      "stripe-webhook processing error",
      event.type,
      error
    );


    if (started) {

      await db.rpc(
        "fail_stripe_webhook_event",
        {
          event_id_value: event.id,
          error_value: message
        }
      );

    }


    return new Response(
      message,
      {
        status: 500
      }
    );

  }

});
