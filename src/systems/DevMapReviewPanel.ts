import type { LevelDefinition } from "../types";
import { DevMapReviews, type MapProposal, type ReviewStatus } from "./DevMapReviewSystem";

const el=<K extends keyof HTMLElementTagNameMap>(tag:K,text?:string):HTMLElementTagNameMap[K]=>{const node=document.createElement(tag);if(text)node.textContent=text;return node;};
const button=(label:string,click:()=>void):HTMLButtonElement=>{const b=el("button",label);b.type="button";b.className="dev-map-button";b.addEventListener("click",click);return b;};
const field=(label:string,max:number):{wrap:HTMLLabelElement;input:HTMLInputElement}=>{const wrap=el("label");wrap.className="dev-map-field";wrap.textContent=label;const input=el("input");input.maxLength=max;wrap.append(input);return{wrap,input};};

export function openDevMapReviewPanel(level:LevelDefinition,onPreview:(proposal:MapProposal)=>void):()=>void{
  document.querySelector(".dev-map-backdrop")?.remove();
  const backdrop=el("div"),panel=el("div"),header=el("div"),content=el("div"),notice=el("p");
  backdrop.className="dev-map-backdrop";panel.className="dev-map-panel";header.className="dev-map-header";content.className="dev-map-content";notice.className="dev-map-notice";
  const title=el("h2","TALLER DE MAPAS · BETA"),close=button("Cerrar",()=>dispose());header.append(title,close);panel.append(header,content);backdrop.append(panel);document.body.append(backdrop);
  backdrop.addEventListener("keydown",event=>{event.stopPropagation();if(event.key==="Escape")dispose();});
  backdrop.addEventListener("keyup",event=>event.stopPropagation());
  function dispose():void{backdrop.remove();}
  const subtitle=el("p","Diseña y prueba tu mapa. Exporta un archivo para enviarlo al revisor. Las decisiones se guardan en este navegador.");content.append(subtitle);
  const exportBox=el("section"),exportTitle=el("h3","1 · Crear propuesta"),titleField=field("Título del mapa",60),authorField=field("Autor",48),intentField=el("label","¿Qué tiro o sorpresa debe descubrir el jugador?"),intent=el("textarea");
  exportBox.className="dev-map-section";intent.maxLength=500;intent.rows=2;intentField.className="dev-map-field";intentField.append(intent);exportBox.append(exportTitle,titleField.wrap,authorField.wrap,intentField);
  titleField.input.value=level.id==="editor-draft"?"":level.id;
  exportBox.append(button("Descargar propuesta JSON",()=>{
    try{const proposal=DevMapReviews.create(level,titleField.input.value,authorField.input.value,intent.value);DevMapReviews.download(proposal);show("Archivo descargado. Compártelo con quien revisa los mapas.");}
    catch(error){show(error instanceof Error?error.message:"No se pudo exportar");}
  }));content.append(exportBox);
  const importBox=el("section"),importTitle=el("h3","2 · Bandeja de revisión"),picker=el("input"),list=el("div");importBox.className="dev-map-section";list.className="dev-map-list";picker.type="file";picker.accept=".json,application/json";picker.className="dev-map-file";
  importBox.append(importTitle,el("p","Importa archivos de tus colegas. Vista previa y prueba el hoyo antes de aceptar o rechazar."),picker,list);content.append(importBox,notice);
  picker.addEventListener("change",()=>{const file=picker.files?.[0];if(!file)return;void file.text().then(raw=>{const item=DevMapReviews.import(raw);show(`Importado: ${item.title}`);renderList();}).catch(error=>show(error instanceof Error?error.message:"Archivo no válido"));picker.value="";});
  function show(message:string):void{notice.textContent=message;}
  function setReview(item:MapProposal,status:ReviewStatus,textarea:HTMLTextAreaElement):void{
    if(status==="rejected"&&!textarea.value.trim()){show("Explica el motivo para que el autor pueda mejorar el mapa.");textarea.focus();return;}
    const updated=DevMapReviews.review(item.id,status,textarea.value);if(!updated){show("No se pudo guardar la revisión.");return;}show(`${status==="accepted"?"Aceptado":"Rechazado"}: ${item.title}. Descarga el resultado para enviarlo al autor.`);renderList();
  }
  function renderList():void{
    list.replaceChildren();const items=DevMapReviews.list();if(!items.length){list.append(el("p","No hay propuestas importadas en este navegador."));return;}
    for(const item of items){const card=el("article"),head=el("div"),meta=el("p"),description=el("p"),actions=el("div"),note=el("textarea");card.className="dev-map-card";head.className="dev-map-card-head";actions.className="dev-map-actions";
      head.append(el("strong",item.title),el("span",item.review.status.toUpperCase()));meta.textContent=`${item.author} · ${new Date(item.createdAt).toLocaleDateString()}`;description.textContent=item.intent||"Sin intención de diseño descrita.";note.placeholder="Motivo de la decisión o cambios solicitados";note.maxLength=500;note.rows=2;note.value=item.review.note;
      actions.append(button("Vista previa / editar",()=>{onPreview(item);dispose();}),button("Aceptar",()=>setReview(item,"accepted",note)),button("Rechazar",()=>setReview(item,"rejected",note)),button("Descargar revisión",()=>DevMapReviews.download({...item,review:{...item.review,note:note.value.slice(0,500)}})));
      card.append(head,meta,description,note,actions);list.append(card);
    }
  }
  renderList();
  return dispose;
}
