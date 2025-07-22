export function displayDialogue(text, onDisplayEnd) {
  const dialogueUI = document.getElementById("textbox-container");
  const dialogue = document.getElementById("dialogue");

  dialogueUI.style.display = "block";

  // Convert \n to <br> tags for HTML line breaks
  const htmlText = text.replace(/\n/g, '<br>');

  let index = 0;
  let currentText = "";
  const intervalRef = setInterval(() => {
    if (index < htmlText.length) {
      currentText += htmlText[index];
      dialogue.innerHTML = currentText;
      index++;
      return;
    }

    clearInterval(intervalRef);
  }, 1);

  const closeBtn = document.getElementById("close");

  function onCloseBtnClick() {
    onDisplayEnd();
    dialogueUI.style.display = "none";
    dialogue.innerHTML = "";
    clearInterval(intervalRef);
    closeBtn.removeEventListener("click", onCloseBtnClick);
  }

  closeBtn.addEventListener("click", onCloseBtnClick);
}

export function displayPDF(pdfPath, onDisplayEnd) {
  const pdfOverlay = document.getElementById("pdf-overlay");
  const pdfViewer = document.getElementById("pdf-viewer");
  const pdfClose = document.getElementById("pdf-close");

  // Set the PDF source
  pdfViewer.src = pdfPath;

  // Show the overlay
  pdfOverlay.style.display = "flex";

  function onCloseBtnClick() {
    onDisplayEnd();
    pdfOverlay.style.display = "none";
    pdfViewer.src = ""; // Clear the source to stop loading
    pdfClose.removeEventListener("click", onCloseBtnClick);
  }

  // Close when clicking the close button
  pdfClose.addEventListener("click", onCloseBtnClick);

  // Close when clicking outside the PDF container
  pdfOverlay.addEventListener("click", (e) => {
    if (e.target === pdfOverlay) {
      onCloseBtnClick();
    }
  });
}

export function setCamScale(k) {
  const resizeFactor = k.width() / k.height();
  if (resizeFactor < 1) {
    k.camScale(k.vec2(1));
  } else {
    k.camScale(k.vec2(1.5));
  }
}