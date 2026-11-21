// "Are you sure?" in the page's own dialog (a klods-modal), instead of the
// browser's confirm(). The dialog is built the first time it's needed, so pages
// only need to import askToConfirm.

let dialog = null;

function buildDialog() {
  dialog = document.createElement("dialog");
  dialog.id = "confirm-dialog";
  dialog.className = "klods-modal";
  dialog.setAttribute("aria-labelledby", "confirm-dialog-title");
  dialog.innerHTML = `
    <form method="dialog" class="klods-modal__panel">
      <div class="klods-modal__header">
        <h2 id="confirm-dialog-title" class="klods-modal__title"></h2>
      </div>
      <p id="confirm-dialog-message" class="klods-modal__body"></p>
      <div class="klods-modal__actions">
        <button id="confirm-dialog-cancel" class="klods-button" value="cancel" autofocus></button>
        <button id="confirm-dialog-ok" class="klods-button" value="confirm"></button>
      </div>
    </form>`;

  // Clicking the backdrop (outside the panel) closes the dialog
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close("cancel");
  });

  document.body.append(dialog);
}

/**
 * Ask the player to confirm something. Resolves true if they confirm; false if
 * they cancel, press Esc or click outside the dialog.
 */
export function askToConfirm({ title, message, confirmLabel, cancelLabel = "Cancel", danger = false }) {
  if (!dialog) buildDialog();
  dialog.querySelector("#confirm-dialog-title").textContent = title;
  dialog.querySelector("#confirm-dialog-message").textContent = message;
  dialog.querySelector("#confirm-dialog-cancel").textContent = cancelLabel;
  const ok = dialog.querySelector("#confirm-dialog-ok");
  ok.textContent = confirmLabel;
  ok.className = `klods-button ${danger ? "klods-button--danger" : "klods-button--primary"}`;

  return new Promise((resolve) => {
    dialog.returnValue = "";
    dialog.addEventListener("close", () => resolve(dialog.returnValue === "confirm"), { once: true });
    dialog.showModal();
  });
}
