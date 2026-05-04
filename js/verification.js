(function () {
  const cfg = window.APP_CONFIG;
  const lookupForm = document.getElementById("lookupForm");
  const proofForm = document.getElementById("proofForm");
  const caseDetails = document.getElementById("caseDetails");
  const caseSummary = document.getElementById("caseSummary");
  const lookupStatus = document.getElementById("lookupStatus");
  const proofStatus = document.getElementById("proofStatus");
  const caseIdInput = document.getElementById("caseId");
  const lookupSubmitButton = document.getElementById("lookupSubmitButton");
  const proofSubmitButton = document.getElementById("proofSubmitButton");
  let loadedCaseId = "";

  if (!cfg || !lookupForm || !proofForm) return;

  const endpoint = `${cfg.supabaseUrl}/functions/v1/verify-case`;

  function setText(node, msg, isError) {
    const icon = isError
      ? '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"></circle><path d="M12 7v6M12 16h.01" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"></path></svg>'
      : '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="1.8"></circle><path d="M8 12.5l2.5 2.5L16.5 9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"></path></svg>';
    const typeClass = isError ? "error" : "success";
    node.innerHTML = msg ? `<span class="status ${typeClass}">${icon}<span>${msg}</span></span>` : "";
  }

  function setButtonLoading(button, isLoading, loadingLabel, defaultLabel) {
    if (!button) return;
    const label = button.querySelector(".button-label");
    button.disabled = isLoading;
    button.dataset.loading = String(isLoading);
    button.setAttribute("aria-busy", String(isLoading));
    if (label) label.textContent = isLoading ? loadingLabel : defaultLabel;
  }

  async function toBase64(file) {
    const arrayBuffer = await file.arrayBuffer();
    let binary = "";
    const bytes = new Uint8Array(arrayBuffer);
    for (let i = 0; i < bytes.length; i += 1) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  lookupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const caseId = caseIdInput.value.trim();
    if (!caseId) return;
    setButtonLoading(lookupSubmitButton, true, "Retrieving...", "Retrieve Case");
    setText(lookupStatus, "Retrieving case...", false);

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        },
        body: JSON.stringify({ action: "lookup", caseId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not retrieve case");

      loadedCaseId = caseId;
      caseSummary.textContent = [
        `Case ID: ${data.case.case_id}`,
        `Name: ${data.case.first_name} ${data.case.last_name}`,
        `Email: ${data.case.email}`,
        `Phone: ${data.case.phone}`,
        `Location: ${data.case.city}, ${data.case.country}`,
        `Loss Range: ${data.case.loss_range}`,
        `Description: ${data.case.case_description}`,
      ].join("\n");
      caseDetails.classList.remove("hidden");
      setText(lookupStatus, "Case found. You can now submit supporting proof.", false);
    } catch (err) {
      setText(lookupStatus, err.message || "Lookup failed.", true);
    } finally {
      setButtonLoading(lookupSubmitButton, false, "Retrieving...", "Retrieve Case");
    }
  });

  proofForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!loadedCaseId) {
      setText(proofStatus, "Retrieve a case first.", true);
      return;
    }

    const notes = document.getElementById("proofNotes").value.trim();
    const filesInput = document.getElementById("proofFiles");
    const files = Array.from(filesInput.files || []).slice(0, 3);

    setButtonLoading(proofSubmitButton, true, "Submitting...", "Submit Verification Proof");
    setText(proofStatus, "Submitting proof...", false);
    try {
      const encodedFiles = [];
      for (const file of files) {
        encodedFiles.push({
          name: file.name,
          type: file.type || "application/octet-stream",
          size: file.size,
          content: await toBase64(file),
        });
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: cfg.supabaseAnonKey,
          Authorization: `Bearer ${cfg.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          action: "submit_proof",
          caseId: loadedCaseId,
          proofNotes: notes,
          files: encodedFiles,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Proof submission failed");

      proofForm.reset();
      setText(proofStatus, "Proof submitted successfully. Confirmation email sent.", false);
    } catch (err) {
      setText(proofStatus, err.message || "Submission failed.", true);
    } finally {
      setButtonLoading(proofSubmitButton, false, "Submitting...", "Submit Verification Proof");
    }
  });
})();
