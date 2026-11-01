/* =========================================================
   CONFIGURAÇÃO — altere aqui o número do WhatsApp do escritório.
   Formato: 55 + DDD + número, só dígitos. Ex.: 5581999998888
   ========================================================= */
const WHATSAPP = "5581000000000";

(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Links de WhatsApp ---------- */
  const waLink = (msg) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`;
  document.querySelectorAll("[data-wa]").forEach((el) => {
    el.href = waLink(el.dataset.wa);
    el.target = "_blank";
    el.rel = "noopener";
  });

  /* ---------- Ano no rodapé ---------- */
  const ano = document.getElementById("ano");
  if (ano) ano.textContent = new Date().getFullYear();

  /* ---------- Header + barra de progresso ---------- */
  const header = document.querySelector(".header");
  const progress = document.getElementById("progress");
  const onScroll = () => {
    const y = window.scrollY;
    header.classList.toggle("is-scrolled", y > 20);
    const max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Menu mobile ---------- */
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  const closeMenu = () => {
    nav.classList.remove("is-open");
    burger.setAttribute("aria-expanded", "false");
  };
  burger.addEventListener("click", () => {
    const open = nav.classList.toggle("is-open");
    burger.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  /* ---------- Revelar ao rolar (com efeito cascata) ---------- */
  const reveals = document.querySelectorAll(".reveal");
  // Atraso em cascata para itens irmãos (cards, passos, nichos...)
  reveals.forEach((el) => {
    const siblings = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    const i = siblings.indexOf(el);
    if (siblings.length > 2) el.style.setProperty("--d", `${(i % 6) * 0.08}s`);
  });
  if ("IntersectionObserver" in window && !reduceMotion) {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      }),
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* ---------- Contadores animados ---------- */
  const counters = document.querySelectorAll("[data-count]");
  const animateCount = (el) => {
    const target = +el.dataset.count;
    if (reduceMotion) { el.textContent = target; return; }
    const dur = 1800;
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / dur, 1);
      el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    const co = new IntersectionObserver((entries) => entries.forEach((e) => {
      if (e.isIntersecting) { animateCount(e.target); co.unobserve(e.target); }
    }), { threshold: 0.6 });
    counters.forEach((c) => co.observe(c));
  } else {
    counters.forEach((c) => (c.textContent = c.dataset.count));
  }

  /* ---------- Texto digitando no hero ---------- */
  const typed = document.getElementById("typed");
  const words = ["crescimento", "lucro", "tranquilidade", "resultado"];
  if (typed && !reduceMotion) {
    let w = 0, c = words[0].length, deleting = true;
    const tick = () => {
      const word = words[w];
      c += deleting ? -1 : 1;
      typed.textContent = word.slice(0, c);
      let delay = deleting ? 55 : 95;
      if (!deleting && c === word.length) { deleting = true; delay = 2200; }
      else if (deleting && c === 0) { deleting = false; w = (w + 1) % words.length; delay = 300; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2500);
  }

  /* ---------- Efeito 3D no painel do hero ---------- */
  const tilt = document.querySelector(".tilt");
  if (tilt && !reduceMotion && window.matchMedia("(hover: hover)").matches) {
    const area = tilt.parentElement;
    area.addEventListener("mousemove", (e) => {
      const r = area.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      tilt.style.transform = `rotateY(${x * 14}deg) rotateX(${-y * 14}deg)`;
    });
    area.addEventListener("mouseleave", () => (tilt.style.transform = ""));
  }

  /* ---------- FAQ: abre um por vez ---------- */
  const items = document.querySelectorAll(".faq__item");
  items.forEach((d) => d.addEventListener("toggle", () => {
    if (d.open) items.forEach((o) => o !== d && (o.open = false));
  }));

  /* ---------- Formulário -> WhatsApp ---------- */
  const form = document.getElementById("form-contato");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      form.querySelectorAll("[required]").forEach((f) => {
        const invalid = !f.value.trim();
        f.classList.toggle("is-invalid", invalid);
        if (invalid) ok = false;
      });
      if (!ok) return;
      const d = new FormData(form);
      const msg =
        `Olá! Vim pelo site.\n\n` +
        `*Nome:* ${d.get("nome")}\n` +
        `*WhatsApp:* ${d.get("telefone")}\n` +
        `*Preciso de:* ${d.get("assunto")}` +
        (d.get("mensagem") ? `\n*Mensagem:* ${d.get("mensagem")}` : "");
      window.open(waLink(msg), "_blank", "noopener");
      form.reset();
    });
  }
})();
