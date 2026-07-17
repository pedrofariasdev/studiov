"use strict";

/* ==========================================================
   StudioV — Publicações
========================================================== */


document.addEventListener("DOMContentLoaded", async () => {


/* ======================================================
   Elementos gerais
====================================================== */


const body = document.body;



/* Sidebar */

const sidebarOverlay = document.getElementById(
  "sidebar-overlay"
);


const sidebarOpenButton = document.getElementById(
  "topbar-menu-button"
);


const sidebarCloseButton = document.getElementById(
  "sidebar-close"
);




/* Workspace */

const currentWorkspaceName = document.getElementById(
  "current-workspace-name"
);


const sidebarUserName = document.getElementById(
  "sidebar-user-name"
);


const sidebarUserEmail = document.getElementById(
  "sidebar-user-email"
);


const sidebarUserAvatar = document.getElementById(
  "sidebar-user-avatar"
);


const topbarAvatar = document.getElementById(
  "topbar-avatar"
);




/* Botões */

const createPublicationButton = document.getElementById(
  "create-publication-button"
);


const emptyCreatePublicationButton = document.getElementById(
  "empty-create-publication-button"
);





/* Modal criar/editar */


const publicationModal = document.getElementById(
  "publication-modal"
);


const publicationModalTitle = document.getElementById(
  "publication-modal-title"
);


const publicationModalClose = document.getElementById(
  "publication-modal-close"
);


const publicationFormCancel = document.getElementById(
  "publication-form-cancel"
);


const publicationForm = document.getElementById(
  "publication-form"
);




const publicationIdInput = document.getElementById(
  "publication-id"
);


const publicationTitleInput = document.getElementById(
  "publication-title"
);


const publicationDescriptionInput = document.getElementById(
  "publication-description"
);


const publicationPlatformInput = document.getElementById(
  "publication-platform"
);


const publicationStatusInput = document.getElementById(
  "publication-status"
);


const publicationDateInput = document.getElementById(
  "publication-date"
);


const publicationLinkInput = document.getElementById(
  "publication-link"
);




const publicationFormError = document.getElementById(
  "publication-form-error"
);


const publicationSubmitText = document.getElementById(
  "publication-form-submit-text"
);


const publicationSubmitButton =
publicationForm?.querySelector(
  'button[type="submit"]'
);


const publicationLoader =
publicationSubmitButton?.querySelector(
  ".button-loader"
);






/* Modal arquivar */


const archivePublicationModal = document.getElementById(
  "archive-publication-modal"
);


const archivePublicationCancel = document.getElementById(
  "archive-publication-cancel"
);


const archivePublicationConfirm = document.getElementById(
  "archive-publication-confirm"
);






/* Pesquisa */


const publicationsSearchInput = document.getElementById(
  "publications-search-input"
);


const publicationsStatusFilter = document.getElementById(
  "publications-status-filter"
);


const publicationsPlatformFilter = document.getElementById(
  "publications-platform-filter"
);


const clearPublicationFiltersButton = document.getElementById(
  "clear-publication-filters-button"
);






/* Estados */


const publicationsLoading = document.getElementById(
  "publications-loading"
);


const publicationsEmpty = document.getElementById(
  "publications-empty"
);


const publicationsNoResults = document.getElementById(
  "publications-no-results"
);


const publicationsGrid = document.getElementById(
  "publications-grid"
);




/* Contadores */


const totalPublicationsCount = document.getElementById(
  "total-publications-count"
);


const scheduledPublicationsCount = document.getElementById(
  "scheduled-publications-count"
);


const publishedPublicationsCount = document.getElementById(
  "published-publications-count"
);





/* Toast */


const toastContainer = document.getElementById(
  "toast-container"
);





/* ======================================================
   Estado da aplicação
====================================================== */


const supabaseClient =
window.supabaseClient;



let currentWorkspace = null;


let publications = [];


let selectedPublicationId = null;


let lastFocusedElement = null;





/* ======================================================
   Utilitários
====================================================== */


function escapeHtml(value = "") {


const element =
document.createElement("div");


element.textContent =
String(value);


return element.innerHTML;


}






function normalizeSearchText(value = "") {


return String(value)

.trim()

.toLowerCase()

.normalize("NFD")

.replace(
/[\u0300-\u036f]/g,
""
);


}






function formatDate(value){


if(!value){

return "Data não definida";

}



const date =
new Date(value);



if(Number.isNaN(date.getTime())){

return "Data inválida";

}



return new Intl.DateTimeFormat(
"pt-PT",
{
day:"2-digit",
month:"short",
year:"numeric"
}
).format(date);


}






function getPlatformIcon(platform){


const icons = {


instagram:"instagram",


facebook:"facebook",


linkedin:"linkedin",


youtube:"youtube",


tiktok:"music-2",


default:"globe"


};



return icons[platform] || icons.default;


}





function getStatusLabel(status){


const labels = {


draft:"Rascunho",


scheduled:"Agendada",


published:"Publicada",


archived:"Arquivada"


};



return labels[status] || "Rascunho";


}

/* ======================================================
   Toasts
====================================================== */


function getToastIcon(type){

const icons = {

success:"circle-check",

error:"circle-alert",

warning:"triangle-alert",

info:"info"

};


return icons[type] || icons.info;

}





function showToast(
type="info",
title="",
message=""
){


if(!toastContainer){

return;

}



const toast =
document.createElement("div");



toast.className =
`toast is-${type}`;





toast.innerHTML = `

<div class="toast-icon">

<i data-lucide="${getToastIcon(type)}"></i>

</div>


<div class="toast-content">

<strong>${escapeHtml(title)}</strong>

<p>${escapeHtml(message)}</p>

</div>


<button
class="toast-close"
type="button"
>

<i data-lucide="x"></i>

</button>

`;



toastContainer.appendChild(toast);



const close =
toast.querySelector(".toast-close");



close?.addEventListener(
"click",
()=>{

toast.remove();

}

);



window.lucide?.createIcons();



setTimeout(()=>{

toast.remove();

},5000);


}







/* ======================================================
   Perfil e Workspace
====================================================== */


async function loadUserProfile(userId){


const {

data,

error

}

=
await supabaseClient

.from("profiles")

.select(
"full_name"
)

.eq(
"id",
userId
)

.maybeSingle();




if(error){

console.warn(
"Erro perfil:",
error.message
);

return null;

}



return data;


}








async function loadCurrentWorkspace(userId){


const {

data:membership,

error

}

=
await supabaseClient

.from("workspace_members")

.select(
"workspace_id,role,status"
)

.eq(
"user_id",
userId
)

.eq(
"status",
"active"
)

.limit(1)

.maybeSingle();





if(error){

throw error;

}




if(!membership){

throw new Error(
"Workspace não encontrado."
);

}





const {

data:workspace,

error:workspaceError

}

=
await supabaseClient

.from("workspaces")

.select(
"id,name,status"
)

.eq(
"id",
membership.workspace_id
)

.single();





if(workspaceError){

throw workspaceError;

}




return {

...workspace,

role:
membership.role

};


}









function getAvatarLetter(
name,
email
){


const value =
name?.trim() ||
email?.trim() ||
"U";



return value
.charAt(0)
.toUpperCase();


}









function updateDashboardIdentity(
user,
profile,
workspace
){



const name =
profile?.full_name ||
user.email.split("@")[0];



const avatar =
getAvatarLetter(
name,
user.email
);




if(currentWorkspaceName){

currentWorkspaceName.textContent =
workspace.name;

}



if(sidebarUserName){

sidebarUserName.textContent =
name;

}



if(sidebarUserEmail){

sidebarUserEmail.textContent =
user.email;

}



if(sidebarUserAvatar){

sidebarUserAvatar.textContent =
avatar;

}



if(topbarAvatar){

topbarAvatar.textContent =
avatar;

}


}









async function initializeWorkspaceContext(){



const user =
await window.studioVAuthReady;



if(!user){

return;

}



try{


const [

profile,

workspace

]

=
await Promise.all([


loadUserProfile(user.id),


loadCurrentWorkspace(user.id)


]);





currentWorkspace =
workspace;




updateDashboardIdentity(
user,
profile,
workspace
);





console.log(
"Workspace carregado:",
workspace
);



}

catch(error){


console.error(
"Erro workspace:",
error
);



showToast(

"error",

"Erro workspace",

"Não foi possível carregar o workspace."

);


}


}









/* ======================================================
   Estados da página
====================================================== */


function setPublicationsView(view){



publicationsLoading?.classList.toggle(

"hidden",

view !== "loading"

);




publicationsEmpty?.classList.toggle(

"hidden",

view !== "empty"

);




publicationsNoResults?.classList.toggle(

"hidden",

view !== "no-results"

);




publicationsGrid?.classList.toggle(

"hidden",

view !== "grid"

);



}









function updatePublicationCounters(){



const scheduled =
publications.filter(

item =>
item.status === "scheduled"

).length;




const published =
publications.filter(

item =>
item.status === "published"

).length;





if(totalPublicationsCount){

totalPublicationsCount.textContent =
publications.length;

}



if(scheduledPublicationsCount){

scheduledPublicationsCount.textContent =
scheduled;

}



if(publishedPublicationsCount){

publishedPublicationsCount.textContent =
published;

}


}









/* ======================================================
   Filtros
====================================================== */


function getFilteredPublications(){



const search =
normalizeSearchText(
publicationsSearchInput?.value || ""
);



const status =
publicationsStatusFilter?.value ||
"all";



const platform =
publicationsPlatformFilter?.value ||
"all";





return publications.filter(
publication=>{


const matchStatus =
status==="all" ||
publication.status===status;




const matchPlatform =
platform==="all" ||
publication.platform===platform;




const content =
normalizeSearchText(

[
publication.title,

publication.description,

publication.platform

]

.join(" ")

);




const matchSearch =
!search ||
content.includes(search);




return (

matchStatus &&

matchPlatform &&

matchSearch

);


}

);


}









function applyPublicationFilters(){


if(publications.length===0){

setPublicationsView("empty");

return;

}




const filtered =
getFilteredPublications();




if(filtered.length===0){


if(publicationsGrid){

publicationsGrid.innerHTML="";

}



setPublicationsView(
"no-results"
);


return;


}



renderPublications(filtered);


}

/* ======================================================
   Renderização das publicações
====================================================== */


function renderPublications(items = publications){


if(!publicationsGrid){

return;

}



publicationsGrid.innerHTML = "";





items.forEach(publication=>{


const archived =
publication.status === "archived";



const platform =
publication.platform || "default";



const status =
getStatusLabel(
publication.status
);



const card =
document.createElement("article");



card.className =
"content-card";



card.dataset.publicationId =
publication.id;





card.innerHTML = `


<header class="content-card-header">


<div class="content-card-identity">


<div class="content-card-avatar">


<i data-lucide="${getPlatformIcon(platform)}"></i>


</div>




<div>


<h2 class="content-card-title">

${escapeHtml(
publication.title || "Publicação sem título"
)}

</h2>




<p class="content-card-subtitle">

${escapeHtml(
publication.platform || "Sem plataforma"
)}

</p>



</div>



</div>



</header>






<div class="content-card-body">


<p>

${
escapeHtml(
publication.description ||
"Nenhuma descrição adicionada."
)
}

</p>





<div class="publication-information">


<div>

<span>

Estado

</span>


<strong>

${status}

</strong>


</div>





<div>

<span>

Data

</span>


<strong>

${
formatDate(
publication.scheduled_at
)

}

</strong>


</div>



</div>




</div>






<footer class="content-card-footer">


<div>


<span 
class="
status-badge

${
archived

?

"status-inactive"

:

"status-active"

}

">

${status}

</span>



<small>

Criada em

${formatDate(
publication.created_at
)}

</small>



</div>







<div class="content-card-actions">





<button

type="button"

class="brand-action-button"

data-publication-action="edit"

>


<i data-lucide="pencil"></i>

Editar


</button>







<button

type="button"

class="brand-action-button"

data-publication-action="${
archived

?

"restore"

:

"archive"

}"

>


<i data-lucide="${
archived

?

"rotate-ccw"

:

"archive"

}"></i>


${
archived

?

"Restaurar"

:

"Arquivar"

}



</button>






</div>



</footer>



`;





publicationsGrid.appendChild(card);



});





setPublicationsView(
"grid"
);





window.lucide?.createIcons();



}









/* ======================================================
   Carregar publicações
====================================================== */


async function loadPublications(){



if(!currentWorkspace?.id){

return;

}





setPublicationsView(
"loading"
);







try{



const {

data,

error

}

=

await supabaseClient

.from("publications")

.select(

`

id,

workspace_id,

title,

description,

platform,

status,

scheduled_at,

link,

created_at,

updated_at

`

)

.eq(

"workspace_id",

currentWorkspace.id

)

.order(

"created_at",

{

ascending:false

}

);






if(error){

throw error;

}





publications =
data || [];






updatePublicationCounters();







if(publications.length === 0){


setPublicationsView(
"empty"
);


return;


}






applyPublicationFilters();







console.log(

"Publicações carregadas:",

publications.length

);






}

catch(error){



console.error(

"Erro ao carregar publicações:",

error

);





showToast(

"error",

"Erro",

"Não foi possível carregar as publicações."

);





}



}









/* ======================================================
   Estado do botão submit
====================================================== */


function setPublicationSubmitting(
loading
){



if(publicationSubmitButton){


publicationSubmitButton.disabled =
loading;



publicationSubmitButton.setAttribute(

"aria-busy",

String(loading)

);


}





if(publicationLoader){


publicationLoader.classList.toggle(

"hidden",

!loading

);


}





if(publicationSubmitText){


publicationSubmitText.textContent =

loading

?

"Guardando..."

:

publicationIdInput.value

?

"Guardar alterações"

:

"Criar publicação";


}



}

/* ======================================================
   Modal
====================================================== */


function openModal(modal){


if(!modal){

return;

}



lastFocusedElement =
document.activeElement;



modal.classList.remove(
"hidden"
);


modal.classList.add(
"is-open"
);



modal.setAttribute(
"aria-hidden",
"false"
);



body.classList.add(
"modal-open"
);


}







function closeModal(modal){


if(!modal){

return;

}



modal.classList.remove(
"is-open"
);


modal.classList.add(
"hidden"
);



modal.setAttribute(
"aria-hidden",
"true"
);



const opened =
document.querySelector(
".modal-overlay.is-open"
);



if(!opened){

body.classList.remove(
"modal-open"
);

}



lastFocusedElement?.focus();



}









/* ======================================================
   Formulário
====================================================== */


function clearPublicationErrors(){



publicationFormError?.classList.add(
"hidden"
);



if(publicationFormError){

publicationFormError.textContent = "";

}


}







function setPublicationError(
input,
message
){



input?.classList.add(
"is-invalid"
);



if(publicationFormError){


publicationFormError.textContent =
message;


publicationFormError.classList.remove(
"hidden"
);


}



}








function resetPublicationForm(){


publicationForm?.reset();



if(publicationIdInput){

publicationIdInput.value = "";

}



if(publicationModalTitle){

publicationModalTitle.textContent =
"Nova publicação";

}



if(publicationSubmitText){

publicationSubmitText.textContent =
"Criar publicação";

}



clearPublicationErrors();



}









function openCreatePublicationModal(){


resetPublicationForm();



openModal(
publicationModal
);



setTimeout(()=>{


publicationTitleInput?.focus();


},100);


}









function openEditPublicationModal(id){



const publication =
publications.find(
item=>item.id === id
);





if(!publication){

showToast(
"error",
"Erro",
"Publicação não encontrada."
);


return;

}





resetPublicationForm();





publicationIdInput.value =
publication.id;



publicationTitleInput.value =
publication.title || "";



publicationDescriptionInput.value =
publication.description || "";



publicationPlatformInput.value =
publication.platform || "instagram";



publicationStatusInput.value =
publication.status || "draft";



publicationDateInput.value =
publication.scheduled_at

?

publication.scheduled_at.slice(
0,
16
)

:

"";



publicationLinkInput.value =
publication.link || "";





publicationModalTitle.textContent =
"Editar publicação";




publicationSubmitText.textContent =
"Guardar alterações";





openModal(
publicationModal
);



}









function validatePublicationForm(){



clearPublicationErrors();



let valid = true;





if(
!publicationTitleInput.value.trim()
){


setPublicationError(

publicationTitleInput,

"Informe o título da publicação."

);



valid=false;


}






if(
!publicationPlatformInput.value
){


setPublicationError(

publicationPlatformInput,

"Selecione uma plataforma."

);



valid=false;


}





return valid;



}









publicationForm?.addEventListener(

"submit",

async event=>{


event.preventDefault();





if(!validatePublicationForm()){

return;

}





if(!currentWorkspace?.id){

return;

}





setPublicationSubmitting(
true
);






const id =
publicationIdInput.value.trim();




const payload = {


title:
publicationTitleInput.value.trim(),



description:
publicationDescriptionInput.value.trim() || null,



platform:
publicationPlatformInput.value,



status:
publicationStatusInput.value,



scheduled_at:
publicationDateInput.value || null,



link:
publicationLinkInput.value.trim() || null


};







try{


let result;






if(id){



result =

await supabaseClient

.from("publications")

.update(payload)

.eq(
"id",
id
);



}

else{



result =

await supabaseClient

.from("publications")

.insert({

workspace_id:
currentWorkspace.id,

...payload

});



}








if(result.error){

throw result.error;

}





closeModal(
publicationModal
);




await loadPublications();





showToast(

"success",

id

?

"Publicação atualizada"

:

"Publicação criada",

"Operação realizada com sucesso."

);



}

catch(error){



console.error(error);



showToast(

"error",

"Erro",

error.message ||

"Não foi possível guardar."

);



}

finally{


setPublicationSubmitting(
false
);


}



}

);









/* ======================================================
   Arquivar / Restaurar
====================================================== */


function openArchivePublicationModal(id){


selectedPublicationId =
id;



openModal(
archivePublicationModal
);


}








function closeArchivePublicationModal(){


closeModal(
archivePublicationModal
);



selectedPublicationId =
null;


}








async function archivePublication(id){


const {

error

}

=
await supabaseClient

.from("publications")

.update({

status:"archived"

})

.eq(
"id",
id
);





if(error){

showToast(
"error",
"Erro",
error.message
);


return;

}




closeArchivePublicationModal();



await loadPublications();



showToast(
"success",
"Arquivada",
"Publicação arquivada."
);


}








async function restorePublication(id){


const {

error

}

=
await supabaseClient

.from("publications")

.update({

status:"draft"

})

.eq(
"id",
id
);






if(error){

showToast(
"error",
"Erro",
error.message
);


return;

}




await loadPublications();



showToast(
"success",
"Restaurada",
"Publicação restaurada."
);


}









/* ======================================================
   Eventos
====================================================== */


createPublicationButton?.addEventListener(
"click",
openCreatePublicationModal
);



emptyCreatePublicationButton?.addEventListener(
"click",
openCreatePublicationModal
);





publicationModalClose?.addEventListener(
"click",
()=>closeModal(publicationModal)
);



publicationFormCancel?.addEventListener(
"click",
()=>closeModal(publicationModal)
);





archivePublicationCancel?.addEventListener(
"click",
closeArchivePublicationModal
);





archivePublicationConfirm?.addEventListener(
"click",
async()=>{


if(selectedPublicationId){

await archivePublication(
selectedPublicationId
);


}


}

);









publicationsGrid?.addEventListener(

"click",

async event=>{


const button =
event.target.closest(
"[data-publication-action]"
);



if(!button){

return;

}




const card =
button.closest(
"[data-publication-id]"
);



const id =
card?.dataset.publicationId;



const action =
button.dataset.publicationAction;






if(action==="edit"){

openEditPublicationModal(id);

}



if(action==="archive"){

openArchivePublicationModal(id);

}



if(action==="restore"){

await restorePublication(id);

}




}

);









publicationsSearchInput?.addEventListener(
"input",
applyPublicationFilters
);


publicationsStatusFilter?.addEventListener(
"change",
applyPublicationFilters
);


publicationsPlatformFilter?.addEventListener(
"change",
applyPublicationFilters
);








clearPublicationFiltersButton?.addEventListener(

"click",

()=>{


publicationsSearchInput.value="";


publicationsStatusFilter.value="all";


publicationsPlatformFilter.value="all";



applyPublicationFilters();



}

);









/* ======================================================
   Sidebar
====================================================== */


sidebarOpenButton?.addEventListener(
"click",
()=>{

body.classList.add(
"sidebar-open"
);

}

);



sidebarCloseButton?.addEventListener(
"click",
()=>{

body.classList.remove(
"sidebar-open"
);

}

);



sidebarOverlay?.addEventListener(
"click",
()=>{

body.classList.remove(
"sidebar-open"
);

}

);









/* ======================================================
   Escape
====================================================== */


document.addEventListener(
"keydown",
event=>{


if(event.key !== "Escape"){

return;

}



if(
archivePublicationModal?.classList.contains(
"is-open"
)
){

closeArchivePublicationModal();

return;

}



if(
publicationModal?.classList.contains(
"is-open"
)
){

closeModal(
publicationModal
);


}



}

);









/* ======================================================
   Inicialização
====================================================== */


await initializeWorkspaceContext();



if(currentWorkspace){


await loadPublications();


}



window.lucide?.createIcons();



});