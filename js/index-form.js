(function () {
  const nav = document.querySelector(".hero-nav");
  const toggle = document.querySelector(".nav-toggle");
  const form = document.getElementById("caseForm");
  const successCard = document.getElementById("caseSuccess");
  const statusNode = document.getElementById("formStatus");
  const cfg = window.APP_CONFIG;

  if (nav && toggle) {
    toggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("menu-open");
      toggle.setAttribute("aria-expanded", String(isOpen));
    });
  }

  if (!form || !cfg) return;

  const endpoint = `${cfg.supabaseUrl}/functions/v1/submit-case`;

  function setStatus(message, isError) {
    if (!statusNode) return;
    statusNode.textContent = message;
    statusNode.style.color = isError ? "rgb(239, 68, 68)" : "rgb(160, 160, 160)";
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    setStatus("Submitting your case...", false);

    const body = {
      firstName: form.firstName.value.trim(),
      lastName: form.lastName.value.trim(),
      email: form.email.value.trim(),
      phone: form.phone.value.trim(),
      city: form.city.value.trim(),
      country: form.country.value.trim(),
      caseDescription: form.description.value.trim(),
      lossRange: form.lossRange.value,
    };

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to submit case");

      form.reset();
      setStatus("", false);
      if (successCard) successCard.classList.remove("hidden");
      form.classList.add("hidden");
    } catch (error) {
      setStatus(error.message || "Submission failed. Please try again.", true);
    }
  });
})();
