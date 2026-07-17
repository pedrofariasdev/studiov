"use strict";

/* ==========================================================
   StudioV — Gestão de Marcas
========================================================== */


document.addEventListener("DOMContentLoaded", async () => {


/* ======================================================
   ELEMENTOS
====================================================== */


const body = document.body;


const sidebarOverlay =
document.getElementById("sidebar-overlay");


const sidebarOpenButton =
document.getElementById("topbar-menu-button");


const sidebarCloseButton =
document.getElementById("sidebar-close");



const createBrandButton =
document.getElementById("create-brand-button");


const emptyCreateBrandButton =
document.getElementById("empty-create-brand-button");



const brandModal =
document.getElementById("brand-modal");


const brandModalTitle =
document.getElementById("brand-modal-title");


const brandModalClose =
document.getElementById("brand-modal-close");


const brandFormCancel =
document.getElementById("brand-form-cancel");



const archiveBrandModal =
document.getElementById("archive-brand-modal");


const archiveBrandCancel =
document.getElementById("archive-brand-cancel");


const archiveBrandConfirm =
document.getElementById("archive-brand-confirm");



const brandForm =
document.getElementById("brand-form");



const brandIdInput =
document.getElementById("brand-id");


const brandNameInput =
document.getElementById("brand-name");


const brandNameError =
document.getElementById("brand-name-error");


const brandIndustryInput =
document.getElementById("brand-industry");


const brandLogoInput =
document.getElementById("brand-logo-url");


const brandLanguageInput =
document.getElementById("brand-language");


const brandWebsiteInput =
document.getElementById("brand-website");


const brandWebsiteError =
document.getElementById("brand-website-error");


const brandDescriptionInput =
document.getElementById("brand-description");


const brandDescriptionCounter =
document.getElementById("brand-description-counter");



const primaryColorPicker =
document.getElementById("brand-primary-color-picker");


const primaryColorInput =
document.getElementById("brand-primary-color");



const secondaryColorPicker =
document.getElementById("brand-secondary-color-picker");


const secondaryColorInput =
document.getElementById("brand-secondary-color");



const brandFormError =
document.getElementById("brand-form-error");


const brandFormSubmitText =
document.getElementById("brand-form-submit-text");



const brandsSearchInput =
document.getElementById("brands-search-input");


const brandsStatusFilter =
document.getElementById("brands-status-filter");


const brandsSortSelect =
document.getElementById("brands-sort-select");



const clearBrandFiltersButton =
document.getElementById("clear-brand-filters-button");



const brandsLoading =
document.getElementById("brands-loading");


const brandsEmpty =
document.getElementById("brands-empty");


const brandsNoResults =
document.getElementById("brands-no-results");


const brandsGrid =
document.getElementById("brands-grid");



const totalBrandsCount =
document.getElementById("total-brands-count");


const activeBrandsCount =
document.getElementById("active-brands-count");


const archivedBrandsCount =
document.getElementById("archived-brands-count");



const toastContainer =
document.getElementById("toast-container");





/* ======================================================
   CONTEXTO
====================================================== */


const supabaseClient =
window.supabaseClient;



const currentWorkspaceName =
document.getElementById(
"current-workspace-name"
);



const sidebarUserName =
document.getElementById(
"sidebar-user-name"
);



const sidebarUserEmail =
document.getElementById(
"sidebar-user-email"
);



const sidebarUserAvatar =
document.getElementById(
"sidebar-user-avatar"
);



const topbarAvatar =
document.getElementById(
"topbar-avatar"
);




let currentWorkspace = null;


let brands = [];


let selectedBrandId = null;


let lastFocusedElement = null;






/* ======================================================
   UTILIDADES
====================================================== */


function escapeHtml(value=""){

const div =
document.createElement("div");


div.textContent =
String(value);


return div.innerHTML;

}




function getSafeColor(
value,
fallback
){

return /^#[0-9A-F]{6}$/i.test(value || "")
?
value
:
fallback;

}




function normalizeSearchText(value=""){

return String(value)
.trim()
.toLowerCase()
.normalize("NFD")
.replace(
/[\u0300-\u036f]/g,
""
);

}




function normalizeHexColor(value=""){

return value
.trim()
.toUpperCase();

}




function isValidHexColor(value){

return /^#[0-9A-F]{6}$/i.test(value);

}




function isValidHttpUrl(value){

if(!value){

return true;

}


try{

const url =
new URL(value);


return (
url.protocol==="http:" ||
url.protocol==="https:"
);


}catch{

return false;

}

}





function formatBrandDate(value){


if(!value){

return "Data indisponível";

}


const date =
new Date(value);



if(Number.isNaN(date.getTime())){

return "Data indisponível";

}



return new Intl.DateTimeFormat(
"pt-PT",
{
day:"2-digit",
month:"short",
year:"numeric"
}
)
.format(date);


}





/* ======================================================
   IDIOMAS
====================================================== */


function getLanguageInfo(code){


const languages={


"pt-PT":{
short:"Português · PT",
full:"Português Portugal"
},


"pt-BR":{
short:"Português · BR",
full:"Português Brasil"
},


"en-US":{
short:"Inglês · US",
full:"Inglês Estados Unidos"
},


"en-GB":{
short:"Inglês · UK",
full:"Inglês Reino Unido"
}


};



return languages[code] || {

short:"Português · PT",

full:"Português"

};


}






/* ======================================================
   TOAST
====================================================== */


function showToast(
type,
title,
message
){


if(!toastContainer){

return;

}



const toast =
document.createElement("div");



toast.className =
`toast is-${type}`;



toast.innerHTML=`

<strong>
${title}
</strong>

<p>
${message}
</p>

`;



toastContainer.appendChild(toast);



setTimeout(()=>{

toast.remove();

},5000);


}






/* ======================================================
   WORKSPACE
====================================================== */


async function loadUserProfile(userId){


const {

data,

error

}

=
await supabaseClient

.from("profiles")

.select("full_name")

.eq("id",userId)

.maybeSingle();



if(error){

console.warn(error.message);

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
"workspace_id, role, status"
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



if(!membership?.workspace_id){

throw new Error(
"Workspace não encontrado"
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

role:membership.role

};


}

/* ======================================================
   IDENTIDADE DO DASHBOARD
====================================================== */


function updateDashboardIdentity(
user,
profile,
workspace
){


const name =
profile?.full_name ||
user.email?.split("@")[0] ||
"Utilizador";


const avatar =
name
.charAt(0)
.toUpperCase();



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



}catch(error){


console.error(
"Erro workspace:",
error
);



showToast(
"error",
"Erro",
"Não foi possível carregar o workspace."
);


}



}









/* ======================================================
   ESTADOS DA PÁGINA
====================================================== */


function setBrandsView(view){



brandsLoading?.classList.toggle(
"hidden",
view !== "loading"
);



brandsEmpty?.classList.toggle(
"hidden",
view !== "empty"
);



brandsNoResults?.classList.toggle(
"hidden",
view !== "no-results"
);



brandsGrid?.classList.toggle(
"hidden",
view !== "grid"
);



}










function updateBrandCounters(){


const active =
brands.filter(
brand =>
brand.status === "active"
)
.length;



const archived =
brands.filter(
brand =>
brand.status === "archived"
)
.length;



if(totalBrandsCount){

totalBrandsCount.textContent =
brands.length;

}



if(activeBrandsCount){

activeBrandsCount.textContent =
active;

}



if(archivedBrandsCount){

archivedBrandsCount.textContent =
archived;

}



}









/* ======================================================
   FILTROS
====================================================== */


function getFilteredAndSortedBrands(){


const search =
normalizeSearchText(
brandsSearchInput?.value || ""
);



const status =
brandsStatusFilter?.value ||
"all";



const sort =
brandsSortSelect?.value ||
"newest";




let filtered =
brands.filter(brand=>{


const matchStatus =
status==="all" ||
brand.status===status;



const content =
normalizeSearchText(

[
brand.name,

brand.industry,

brand.description,

brand.website_url

]

.filter(Boolean)

.join(" ")

);



const matchSearch =
!search ||
content.includes(search);



return (
matchStatus &&
matchSearch
);


});






filtered.sort(
(a,b)=>{


if(sort==="name-asc"){

return a.name.localeCompare(
b.name
);

}



if(sort==="name-desc"){

return b.name.localeCompare(
a.name
);

}



if(sort==="oldest"){

return new Date(a.created_at)
-
new Date(b.created_at);

}



return new Date(b.created_at)
-
new Date(a.created_at);



}

);



return filtered;



}









function applyBrandFilters(){


if(brands.length===0){

setBrandsView(
"empty"
);

return;

}



const filtered =
getFilteredAndSortedBrands();



if(filtered.length===0){


if(brandsGrid){

brandsGrid.innerHTML="";

}



setBrandsView(
"no-results"
);



return;

}



renderBrands(filtered);



}









/* ======================================================
   RENDER CARDS
====================================================== */


function renderBrands(items=[]){


if(!brandsGrid){

return;

}



brandsGrid.innerHTML="";





items.forEach(brand=>{


const primary =
getSafeColor(
brand.primary_color,
"#6D28D9"
);



const secondary =
getSafeColor(
brand.secondary_color,
"#A78BFA"
);



const language =
getLanguageInfo(
brand.default_language
);



const archived =
brand.status==="archived";



const initial =
brand.name
?.charAt(0)
.toUpperCase()
||
"M";





const card =
document.createElement("article");



card.className =
"content-card";



card.dataset.brandId =
brand.id;






card.innerHTML = `


<header class="content-card-header">


<div class="content-card-identity">


<div

class="content-card-avatar"

style="background:${primary}"

>


${
brand.logo_url

?

`

<img

src="${escapeHtml(brand.logo_url)}"

alt="${escapeHtml(brand.name)}"

>

`

:

initial

}


</div>





<div>


<h2 class="content-card-title">

${escapeHtml(brand.name)}

</h2>




<p class="content-card-subtitle">

${escapeHtml(
brand.industry ||
"Segmento não definido"
)}

</p>



</div>



</div>


</header>







<div class="content-card-body">


<p>

${escapeHtml(
brand.description ||
"Nenhuma descrição adicionada."
)}

</p>






<div class="brand-colors">


<span

style="background:${primary}"

></span>


<span

style="background:${secondary}"

></span>


</div>







<div class="brand-information">



<div>

<span>
Idioma
</span>


<strong>

${language.short}

</strong>


</div>




<div>

<span>
Website
</span>


<strong>

${escapeHtml(
brand.website_url ||
"Não definido"
)}

</strong>


</div>



</div>



</div>








<footer class="content-card-footer">



<div>


<span

class="status-badge ${
archived
?
"status-inactive"
:
"status-active"
}"

>


${
archived
?
"Arquivada"
:
"Ativa"
}


</span>



<small>

Criada em

${formatBrandDate(
brand.created_at
)}

</small>


</div>






<div class="content-card-actions">



<button

type="button"

class="brand-action-button"

data-brand-action="edit"

>

<i data-lucide="pencil"></i>

Editar

</button>






<button

type="button"

class="brand-action-button"

data-brand-action="${
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





brandsGrid.appendChild(card);



});




setBrandsView(
"grid"
);



window.lucide?.createIcons();



}

/* ======================================================
   CARREGAR MARCAS
====================================================== */


async function loadBrands(){


if(!currentWorkspace?.id){

return;

}



setBrandsView("loading");



try{


const {

data,

error

}

=
await supabaseClient

.from("brands")

.select("*")

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



brands =
data || [];



updateBrandCounters();



if(brands.length===0){

setBrandsView("empty");

return;

}



applyBrandFilters();



}catch(error){


console.error(
"Erro ao carregar marcas:",
error
);



showToast(
"error",
"Erro",
"Não foi possível carregar marcas."
);


}



}









/* ======================================================
   MODAIS
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



body.classList.remove(
"modal-open"
);



lastFocusedElement?.focus();



}








/* ======================================================
   FORMULÁRIO
====================================================== */


function clearForm(){


brandForm?.reset();



if(brandIdInput){

brandIdInput.value="";

}



if(primaryColorInput){

primaryColorInput.value="#6D28D9";

}



if(secondaryColorInput){

secondaryColorInput.value="#A78BFA";

}



if(brandModalTitle){

brandModalTitle.textContent =
"Nova marca";

}



if(brandFormSubmitText){

brandFormSubmitText.textContent =
"Criar marca";

}



if(brandFormError){

brandFormError.textContent="";

}



}




function openCreateBrandModal(){


clearForm();


openModal(
brandModal
);



}





function openEditBrandModal(id){


const brand =
brands.find(
item=>item.id===id
);



if(!brand){

return;

}



clearForm();



brandIdInput.value =
brand.id;



brandNameInput.value =
brand.name || "";



brandIndustryInput.value =
brand.industry || "";



brandDescriptionInput.value =
brand.description || "";



brandWebsiteInput.value =
brand.website_url || "";



brandLogoInput.value =
brand.logo_url || "";



brandLanguageInput.value =
brand.default_language || "pt-PT";



primaryColorInput.value =
brand.primary_color ||
"#6D28D9";



secondaryColorInput.value =
brand.secondary_color ||
"#A78BFA";



brandModalTitle.textContent =
"Editar marca";



brandFormSubmitText.textContent =
"Guardar alterações";



openModal(
brandModal
);



}








async function saveBrand(event){


event.preventDefault();




const name =
brandNameInput.value.trim();



if(!name){

showToast(
"error",
"Erro",
"Informe o nome da marca."
);


return;

}



const editing =
Boolean(
brandIdInput.value
);





const payload = {


brand_name:name,


brand_description:
brandDescriptionInput.value.trim(),


brand_industry:
brandIndustryInput.value.trim(),


brand_website_url:
brandWebsiteInput.value.trim(),


brand_logo_url:
brandLogoInput.value.trim(),


brand_primary_color:
primaryColorInput.value,


brand_secondary_color:
secondaryColorInput.value,


brand_default_language:
brandLanguageInput.value


};





try{


let response;



if(editing){


response =
await supabaseClient.rpc(
"update_brand",
{

target_brand_id:
brandIdInput.value,

...payload

}
);



}else{


response =
await supabaseClient.rpc(
"create_brand",
{

target_workspace_id:
currentWorkspace.id,

...payload

}
);



}



if(response.error){

throw response.error;

}



closeModal(
brandModal
);



await loadBrands();



showToast(
"success",
"Sucesso",
editing
?
"Marca atualizada."
:
"Marca criada."
);



}catch(error){


console.error(error);



showToast(
"error",
"Erro",
error.message
);



}



}








/* ======================================================
   ARQUIVAR / RESTAURAR
====================================================== */


function openArchiveBrandModal(id){


selectedBrandId =
id;


openModal(
archiveBrandModal
);



}




async function archiveBrand(){


if(!selectedBrandId){

return;

}



try{


const {

error

}

=
await supabaseClient.rpc(
"archive_brand",
{

target_brand_id:
selectedBrandId

}
);



if(error){

throw error;

}



closeModal(
archiveBrandModal
);



await loadBrands();



showToast(
"success",
"Marca arquivada",
"A marca foi arquivada."
);



}catch(error){


console.error(error);



}




}







async function restoreBrand(id){


try{


const {

error

}

=
await supabaseClient.rpc(
"restore_brand",
{

target_brand_id:id

}
);



if(error){

throw error;

}



await loadBrands();



showToast(
"success",
"Marca restaurada",
"A marca voltou a ficar ativa."
);



}catch(error){


console.error(error);



}



}








/* ======================================================
   EVENTOS
====================================================== */


createBrandButton?.addEventListener(
"click",
openCreateBrandModal
);



emptyCreateBrandButton?.addEventListener(
"click",
openCreateBrandModal
);



brandModalClose?.addEventListener(
"click",
()=>{

closeModal(
brandModal
);

});



brandFormCancel?.addEventListener(
"click",
()=>{

closeModal(
brandModal
);

});



brandForm?.addEventListener(
"submit",
saveBrand
);




archiveBrandConfirm?.addEventListener(
"click",
archiveBrand
);





brandsGrid?.addEventListener(
"click",
async event=>{


const button =
event.target.closest(
"[data-brand-action]"
);



if(!button){

return;

}



const card =
button.closest(
"[data-brand-id]"
);



const id =
card.dataset.brandId;



const action =
button.dataset.brandAction;




if(action==="edit"){

openEditBrandModal(id);

}



if(action==="archive"){

openArchiveBrandModal(id);

}



if(action==="restore"){

await restoreBrand(id);

}



});







brandsSearchInput?.addEventListener(
"input",
applyBrandFilters
);



brandsStatusFilter?.addEventListener(
"change",
applyBrandFilters
);



brandsSortSelect?.addEventListener(
"change",
applyBrandFilters
);









/* ======================================================
   SIDEBAR MOBILE
====================================================== */


sidebarOpenButton?.addEventListener(
"click",
()=>{

body.classList.add(
"sidebar-open"
);

});



sidebarCloseButton?.addEventListener(
"click",
()=>{

body.classList.remove(
"sidebar-open"
);

});



sidebarOverlay?.addEventListener(
"click",
()=>{

body.classList.remove(
"sidebar-open"
);

});









/* ======================================================
   INICIALIZAÇÃO
====================================================== */


await initializeWorkspaceContext();



if(currentWorkspace){

await loadBrands();

}



window.lucide?.createIcons();



});