import type { CSSProperties } from "react";
export default function Image({src,alt,fill,className,style}:{src:string;alt:string;fill?:boolean;className?:string;style?:CSSProperties;sizes?:string}){
  return <img src={src.startsWith("/")?`/studio-perola-leite${src}`:src} alt={alt} className={className} style={{...(fill?{position:"absolute",height:"100%",width:"100%",inset:0} as CSSProperties:{}),...style}}/>;
}
