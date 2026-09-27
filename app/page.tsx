import Image from "next/image";
import { ArrowUpRight, CalendarDays, MapPin, Sparkles } from "lucide-react";
import Gallery from "./gallery";
import MotionEnhancements from "./motion-enhancements";

const services = [
  { id: "fibra", name: "Alongamento em fibra de vidro", detail: "Estrutura leve e acabamento elegante", image: "/images/francesinha.webp" },
  { id: "esmalte-gel", name: "Esmaltação em gel", detail: "Cor e brilho para acompanhar sua rotina", image: "/images/rosa.webp" },
  { id: "blindagem", name: "Blindagem", detail: "Cuidado e resistência para unhas naturais", image: "/images/preto.webp" },
];

export default function Home() {
  return <main>
    <MotionEnhancements />
    <header className="topbar shell">
      <a href="/" className="brand" aria-label="Studio Pérola Leite, início"><span className="brand-script">Pérola Leite</span><span className="brand-sub">NAIL DESIGNER · LAVRAS, MG</span></a>
      <nav aria-label="Navegação principal"><a href="#servicos">Serviços</a><a href="#galeria">Galeria</a><a href="#sobre">O Studio</a></nav>
      <details className="mobile-menu"><summary aria-label="Abrir menu">Menu <span aria-hidden="true">☰</span></summary><nav aria-label="Navegação mobile"><a href="#servicos">Serviços</a><a href="#galeria">Galeria</a><a href="#sobre">O Studio</a><a href="/agendar">Agendar horário</a></nav></details>
      <a className="top-cta" href="/agendar">Agendar horário <ArrowUpRight size={16}/></a>
    </header>
    <section className="hero shell" data-reveal>
      <div className="hero-copy">
        <span className="eyebrow"><Sparkles size={15}/> SEU MOMENTO DE CUIDADO</span>
        <h1>Unhas que traduzem <em>quem você é.</em></h1>
        <p>Um atendimento feito com carinho, técnica e atenção aos detalhes. Escolha seu procedimento e encontre o seu horário no Studio Pérola Leite.</p>
        <div className="hero-actions"><a href="/agendar" className="button-main"><CalendarDays size={19}/> Agendar meu horário <ArrowUpRight size={18}/></a><a href="#servicos" className="button-link">Conhecer serviços <span>↗</span></a></div>
        <div className="hero-note"><span className="note-line"/><span>ATENDIMENTO EM LAVRAS · MG</span></div>
      </div>
      <div className="hero-visual"><div className="hero-img-main"><Image src="/images/francesinha.webp" alt="Unhas com alongamento e nail art feitas no Studio Pérola Leite" fill priority sizes="(max-width: 800px) 80vw, 32vw"/></div><div className="hero-img-side"><Image src="/images/rosa.webp" alt="Esmaltação rosa em unhas longas" fill priority sizes="(max-width: 800px) 35vw, 16vw"/></div><span className="vertical-word">BELEZA NOS DETALHES</span><span className="hero-stamp">P<span>♡</span>L</span></div>
    </section>
    <section className="intro-band"><div className="shell intro-grid"><div><span className="eyebrow">FEITO PARA VOCÊ</span><h2>Seu próximo <em>momento favorito</em> começa aqui.</h2></div><p>Do alongamento à esmaltação, cada detalhe é pensado para que você saia se sentindo ainda mais você.</p><a href="/agendar" aria-label="Agendar horário"><ArrowUpRight size={28}/></a></div></section>
    <section className="booking-guide shell" aria-labelledby="booking-guide-title" data-reveal><div><span className="eyebrow">SIMPLES DE AGENDAR</span><h2 id="booking-guide-title">Seu horário, em poucos passos.</h2></div><ol><li><span>01</span>Escolha o serviço</li><li><span>02</span>Selecione data e horário</li><li><span>03</span>Confirme seus dados</li></ol></section>
    <section id="servicos" className="section shell" data-reveal><div className="section-heading"><div><span className="eyebrow">O QUE FAZEMOS</span><h2>Serviços para <em>realçar</em> você</h2></div><a href="/agendar" className="text-link">Ver horários disponíveis <ArrowUpRight size={16}/></a></div><div className="service-grid">{services.map((s,i)=><article className="service-card" key={s.name} data-reveal style={{"--reveal-delay":`${i*90}ms`} as React.CSSProperties}><div className="service-photo"><Image src={s.image} alt={s.name + " realizado no Studio"} fill sizes="(max-width: 700px) 90vw, 30vw"/></div><div className="service-info"><span>0{i+1} / SERVIÇO</span><h3>{s.name}</h3><p>{s.detail}</p><a href={`/agendar?servico=${s.id}`}>Agendar <ArrowUpRight size={16}/></a></div></article>)}</div></section>
    <section id="galeria" className="section gallery-section" data-reveal><div className="shell"><div className="section-heading"><div><span className="eyebrow">NOSSO TRABALHO</span><h2>Inspiração em <em>cada detalhe.</em></h2></div><a className="text-link" href="https://www.instagram.com/studioperolaleite/" target="_blank" rel="noreferrer">Ver Instagram <ArrowUpRight size={17}/></a></div><Gallery/></div></section>
    <section id="sobre" className="about-section shell" data-reveal><div className="about-photo"><Image src="/images/profissional-aprimorada.png" alt="Pérola Leite no Studio, diante da coleção de esmaltes" fill sizes="(max-width: 700px) 80vw, 30vw"/></div><div className="about-copy"><span className="eyebrow">PRAZER, PÉROLA LEITE</span><h2>Um espaço para você <em>se sentir bem.</em></h2><p>O Studio Pérola Leite é dedicado à beleza das unhas em Lavras, MG. Conheça os trabalhos, escolha o serviço e reserve seu momento com praticidade.</p><div className="location"><MapPin size={21}/><span>Rua Evaristo Alves, 110<br/>Lavras · Minas Gerais</span></div><div className="location"><CalendarDays size={21}/><span>Segunda a sexta · 8h às 18h<br/>Intervalo: 12h às 13h30</span></div><a href="/agendar" className="button-main">Escolher meu horário <ArrowUpRight size={17}/></a></div></section>
    <section className="faq-section shell"><div><span className="eyebrow">DÚVIDAS FREQUENTES</span><h2>Antes de <em>agendar.</em></h2></div><div className="faq-list"><details><summary>Como faço meu agendamento?</summary><p>Escolha o serviço, selecione um dia e um horário disponível e confirme seus dados. Você receberá a confirmação na própria página.</p></details><details><summary>Onde fica o Studio?</summary><p>Rua Evaristo Alves, 110, em Lavras, Minas Gerais.</p></details><details><summary>Quando o Studio atende?</summary><p>De segunda a sexta, das 8h às 18h, com intervalo das 12h às 13h30.</p></details><details><summary>Onde vejo os valores?</summary><p>Os valores aparecem no agendamento quando cadastrados. Para serviços ainda sem valor informado, consulte o Studio antes de marcar.</p></details></div></section>
    <section className="closing" data-reveal><div className="shell"><span className="eyebrow">ESTAMOS TE ESPERANDO</span><h2>Seu momento de brilhar <em>está a um clique.</em></h2><a href="/agendar" className="button-main light closing-cta">Agendar horário</a></div></section>
    <footer className="footer shell"><a href="/" className="brand"><span className="brand-script">Pérola Leite</span><span className="brand-sub">NAIL DESIGNER · LAVRAS, MG</span></a><span>Studio Pérola Leite · Lavras, MG</span><div><a href="https://www.instagram.com/studioperolaleite/" target="_blank" rel="noreferrer">Instagram</a><a href="/admin">Administração</a></div></footer>
    <a className="mobile-sticky-cta" href="/agendar"><CalendarDays size={18}/> Agendar horário</a>
  </main>;
}
