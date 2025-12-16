// Récupération des éléments
var modal = document.getElementById("myModal");
var img = document.getElementById("myImg");
var modalImg = document.getElementById("img01");
var captionText = document.getElementById("caption");

// Variables pour le zoom et le pan
let scale = 1;
let panning = false;
let pointX = 0;
let pointY = 0;
let startX = 0;
let startY = 0;

// 1. Fonction pour OUVRIR la modale
function openModal() {
  modal.style.display = "block";
  modalImg.src = img.src; // On reprend la source de l'image cliquée
  
  // Réinitialiser le zoom à chaque ouverture
  scale = 1;
  pointX = 0;
  pointY = 0;
  updateTransform();
}

// 2. Fonction pour FERMER la modale
function closeModal() {
  modal.style.display = "none";
}

// Fermer si on clique en dehors de l'image (sur le fond noir)
modal.onclick = function(event) {
    if (event.target === modal || event.target.className === 'modal-content-container') {
        closeModal();
    }
}

// 3. Gestion du ZOOM (Molette souris)
modalImg.addEventListener('wheel', function(e) {
    e.preventDefault();
    
    // Sens du zoom
    const delta = e.deltaY * -0.01;
    const newScale = Math.min(Math.max(1, scale + delta), 6); // Min x1, Max x6

    scale = newScale;
    updateTransform();
});

// 4. Gestion du DÉPLACEMENT (Drag & Drop)
modalImg.addEventListener('mousedown', function(e) {
    e.preventDefault();
    start = { x: e.clientX - pointX, y: e.clientY - pointY };
    panning = true;
});

modalImg.addEventListener('mouseup', function(e) {
    panning = false;
});

modalImg.addEventListener('mousemove', function(e) {
    e.preventDefault();
    if (!panning) return;
    
    pointX = (e.clientX - start.x);
    pointY = (e.clientY - start.y);
    updateTransform();
});

// Fonction utilitaire pour appliquer les transfos CSS
function updateTransform() {
    modalImg.style.transform = `translate(${pointX}px, ${pointY}px) scale(${scale})`;
}