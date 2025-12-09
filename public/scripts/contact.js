const form = document.getElementById("contactForm");
const status = document.getElementById("formStatus");
const submitBtn = document.getElementById("submitBtn");

function setError(field, message) {
  const el = document.querySelector(`.field-error[data-for="${field}"]`);
  if (el) el.textContent = message || "";
}

function validate(values) {
  let ok = true;

  // Nombre (mín 2 caracteres)
  if (!values.name || values.name.trim().length < 2) {
    setError("name", "Ingresá tu nombre (mínimo 2 caracteres).");
    ok = false;
  } else {
    setError("name", "");
  }

  // Email (validación básica)
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!values.email || !emailRegex.test(values.email.trim())) {
    setError("email", "Ingresá un email válido.");
    ok = false;
  } else {
    setError("email", "");
  }

  // Mensaje (mín 10 caracteres)
  if (!values.message || values.message.trim().length < 10) {
    setError("message", "Escribí un mensaje (mínimo 10 caracteres).");
    ok = false;
  } else {
    setError("message", "");
  }

  return ok;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const values = {
    name: form.elements.name.value,
    email: form.elements.email.value,
    message: form.elements.message.value,
  };

  status.textContent = "";

  if (!validate(values)) return;

  submitBtn.disabled = true;
  submitBtn.textContent = "Enviando…";

  try {
    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });

    const data = await res.json();

    if (!res.ok) {
      status.textContent = data?.error || "Hubo un problema al enviar.";
      status.style.color = "#c62828";
      return;
    }

    status.textContent = "¡Mensaje enviado! Gracias por contactarte.";
    status.style.color = "#1e88e5";
    form.reset();
  } catch (err) {
    status.textContent = "No se pudo conectar con el servidor.";
    status.style.color = "#c62828";
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = "Enviar";
  }
});
