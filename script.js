function showStandards() {
  const region = document.getElementById("region").value;
  const use = document.getElementById("use").value;
  const box = document.getElementById("standardsBox");

  let html = "";

  const isTieDown = use === "Tie Down / Ratchet Strap";
  const isSling = use === "Lifting Sling";
  const isTow = use === "Tow Strap / Recovery Strap";

  if (region === "us") {
    if (isTieDown) {
      html = `
        <strong>🇺🇸 Tie-Down / Ratchet Strap Inspection Standards:</strong><br>
        • FMCSA, DOT, NHTSA, WSTDA, OSHA
      `;
    } else if (isSling) {
      html = `
        <strong>🇺🇸 Lifting Sling Inspection Standards:</strong><br>
        • OSHA, ASME B30, ANSI, WSTDA, NACM, ASTM
      `;
    } else if (isTow) {
      html = `
        <strong>🇺🇸 Towing / Recovery Strap Best Practices:</strong><br>
        • Recommended: OSHA, ASME B30, WSTDA
      `;
    }
  } else if (region === "ca") {
    if (isTieDown) {
      html = `
        <strong>🇨🇦 Tie-Down / Ratchet Strap Inspection Standards:</strong><br>
        • Transport Canada, CCMTA, NSC 10, CVSA, CSA
      `;
    } else if (isSling) {
      html = `
        <strong>🇨🇦 Lifting Sling Inspection Standards:</strong><br>
        • CSA B167, ASME B30, ANSI, CCOHS
      `;
    } else if (isTow) {
      html = `
        <strong>🇨🇦 Towing / Recovery Strap Best Practices:</strong><br>
        No specific federal regs.<br>
        Recommended: CSA B167, ASME B30, Provincial OHS
      `;
    }
  }

  box.innerHTML = html;
}

async function showResult() {
  const damageFile = document.getElementById("damageUpload").files[0];

  if (!damageFile) {
    alert("Please upload the damaged area photo.");
    return;
  }

  document.getElementById("processingMessage").style.display = "block";

  const readAsBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const damageBase64 = await readAsBase64(damageFile);

  if (!damageBase64.startsWith("data:image")) {
    alert("The uploaded file is not a valid image.");
    document.getElementById("processingMessage").style.display = "none";
    return;
  }

  const payload = {
    imageBase64: damageBase64,
    material: document.getElementById("material").value,
    productType: document.getElementById("use").value,
    region: document.getElementById("region").value,
    notes: document.getElementById("additional").value,
  };

  try {
    const res = await fetch("/api/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    const result = data.result;

    const resultBox = document.getElementById("resultBox");
    resultBox.style.display = "block";

    // Strip the "Detected Damage: ..." line from raw result
    const cleanedResult = result.replace(/Detected Damage:.*$/im, "").trim();
    resultBox.innerHTML = `<strong>AI Inspection Result:</strong><br>${cleanedResult}`;

    // Parse and display structured Detected Damage list
    const damageMatch = result.match(/Detected Damage:\s*(.+)/i);
    if (damageMatch) {
      const damageList = damageMatch[1].split(',').map(d => d.trim());
      const listHtml = damageList.map(d => `<li>${d}</li>`).join('');
      resultBox.innerHTML += `<br><br><strong>Detected Damage Types:</strong><ul>${listHtml}</ul>`;
    }

    const cleanResult = result.toUpperCase().replace(/[^A-Z0-9 ]/g, "");

    if (cleanResult.includes("FAIL")) {
      resultBox.style.backgroundColor = "#fdecea";
      resultBox.style.borderColor = "#f5c2c7";
      resultBox.style.color = "#b02a37";
    } else if (cleanResult.includes("PASS")) {
      resultBox.style.backgroundColor = "#e8f5e9";
      resultBox.style.borderColor = "#c8e6c9";
      resultBox.style.color = "#256029";
    } else {
      resultBox.style.backgroundColor = "#E5EAEF";
      resultBox.style.borderColor = "#ccc";
      resultBox.style.color = "#222";
    }

    document.getElementById("processingMessage").style.display = "none";
  } catch (err) {
    console.error("Fetch failed:", err);
    document.getElementById("processingMessage").style.display = "none";
    const resultBox = document.getElementById("resultBox");
    resultBox.style.display = "block";
    resultBox.style.backgroundColor = "#fff3cd";
    resultBox.style.borderColor = "#ffeeba";
    resultBox.style.color = "#856404";
    resultBox.innerHTML = `<strong>Error:</strong><br>Inspection failed. Try again later.`;
  }
}

// Show preview of uploaded image
document.getElementById("damageUpload").addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const preview = document.getElementById("damagePreview");
    preview.src = URL.createObjectURL(file);
    preview.style.display = "block";
  }
});

// Initialize standards on load
window.addEventListener("DOMContentLoaded", () => {
  showStandards();
});
