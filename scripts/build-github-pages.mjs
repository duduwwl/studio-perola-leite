import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Run after npm run build, with the local compiled Worker running.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const output=path.join(root,"docs");
const studio="https://studio-perola-leite.duducraft11.chatgpt.site";
const local=process.argv[2]??"http://127.0.0.1:8787";
const response=await fetch(local+"/");
if(!response.ok)throw new Error(`Home render failed: ${response.status}`);
let html=await response.text();
const styles=[...html.matchAll(/<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g)].map(m=>m[1]);
if(!styles.length)throw new Error("Missing compiled stylesheet");
fs.mkdirSync(path.join(output,"assets"),{recursive:true});
const css=styles.map(href=>fs.readFileSync(path.join(root,"dist/client",href.replace(/^\//,"")),"utf8")).join("\n");
fs.writeFileSync(path.join(output,"assets/site.css"),css+"\n.pages-gallery-dialog{border:0;padding:20px;max-width:min(92vw,600px);background:#fffaf5;color:#623746}.pages-gallery-dialog::backdrop{background:#24151ad9}.pages-gallery-dialog img{display:block;max-height:75vh;max-width:100%;object-fit:contain;margin:auto}.pages-gallery-dialog button{display:block;margin-left:auto;background:#693947;color:#fff;padding:10px 16px;border:0}.pages-gallery-dialog h2{font:24px Georgia,serif;margin:12px 0}\n");
html=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,"").replace(/<link\b[^>]*>/gi,tag=>/rel="stylesheet"/.test(tag)?'<link rel="stylesheet" href="./assets/site.css">':/rel="(?:modulepreload|preload)"/.test(tag)?"":tag);
html=html.replace(/(?:src|href)="\/_next\/image\?([^"\s]+)"/g,(_,query)=>`src=".${new URLSearchParams(query.replaceAll("&amp;","&")).get("url")}"`);
html=html.replace(/\s+srcset="[^"]*"/gi,"");
html=html.replace(/href="\/agendar([^"\s]*)"/g,'href="./agendar/$1"').replace(/href="\/admin"/g,'href="./admin/"').replace(/href="\/"/g,'href="./"').replace(/href="\/favicon.svg"/g,'href="./favicon.svg"');
html=html.replace(/src="\/images\//g,'src="./images/');
html=html.replace("</body>",'<dialog class="pages-gallery-dialog" aria-labelledby="gallery-title"><button type="button" data-close>Fechar</button><h2 id="gallery-title"></h2><img alt=""></dialog><script src="./assets/site.js" defer></script></body>');
fs.writeFileSync(path.join(output,"index.html"),html);
fs.cpSync(path.join(root,"public/images"),path.join(output,"images"),{recursive:true});
fs.copyFileSync(path.join(root,"public/favicon.svg"),path.join(output,"favicon.svg"));
fs.writeFileSync(path.join(output,".nojekyll"),"");
fs.writeFileSync(path.join(output,"assets/site.js"),`const dialog=document.querySelector('.pages-gallery-dialog');document.querySelectorAll('.gallery-photo').forEach(button=>button.addEventListener('click',()=>{const photo=button.querySelector('img');dialog.querySelector('img').src=photo.src;dialog.querySelector('img').alt=photo.alt;dialog.querySelector('h2').textContent=photo.alt;dialog.showModal()}));dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});document.querySelectorAll('.mobile-menu a').forEach(link=>link.addEventListener('click',()=>link.closest('details').removeAttribute('open')));if(!matchMedia('(prefers-reduced-motion: reduce)').matches&&'IntersectionObserver' in window){const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('in-view');observer.unobserve(entry.target)}}),{threshold:.08});document.querySelectorAll('[data-reveal]').forEach(element=>{if(element.getBoundingClientRect().top<innerHeight*.9)element.classList.add('in-view');observer.observe(element)});document.documentElement.classList.add('motion-ready')}`);
if(/\/_next\/(image|static)|\/api\//.test(html))throw new Error("Static page contains a server-only resource");
console.log("GitHub Pages generated in docs/: homepage, gallery, local images and internal page links.");

