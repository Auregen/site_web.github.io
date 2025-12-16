// Variables globales
let allImagesData = [];
let currentImagesData = [];
const imageContainer = document.getElementById('image-container');
const loadBtn = document.getElementById('loadBtn');
const randomizeBtn = document.getElementById('randomizeBtn');
const clusterBtn = document.getElementById('clusterBtn');
const resetBtn = document.getElementById('resetBtn'); // Nouveau bouton
const statusText = document.getElementById('statusText');
const classCountInput = document.getElementById('classCount');
const imagesPerClassInput = document.getElementById('imagesPerClass');
const imageSizeInput = document.getElementById('imageSize');

// Couleurs
const clusterColors = [
    '#B585B8', '#8BBD8F', '#B68E87', '#868AB8', '#84B8B7',
    '#CD6D4E', '#3592B1', '#8F877B', '#DDA0DD', '#98D8C8'
];

// Étape 1: Charger le fichier CSV (CHEMIN CORRIGÉ)
async function loadAllCSV() {
    try {
        statusText.textContent = 'Chargement du CSV...';
        
        // CORRECTION ICI : "../dataset.csv" car le HTML est dans un sous-dossier
        const response = await fetch('../dataset.csv');
        
        if (!response.ok) throw new Error("Fichier dataset.csv introuvable");

        const csvText = await response.text();
        const lines = csvText.split('\n');
        allImagesData = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            // Petite sécurité pour ignorer les lignes vides ou corrompues
            if (line && line.length < 200 && !line.includes('DOCTYPE')) {
                const values = line.split(',');
                if (values.length >= 2) {
                    allImagesData.push({
                        imageName: values[0].trim(),
                        category: values[1].trim()
                    });
                }
            }
        }
        
        statusText.textContent = `Données chargées (${allImagesData.length} images)`;
        return true;
    } catch (error) {
        console.error('Erreur:', error);
        statusText.textContent = 'Erreur: Impossible de trouver ../dataset.csv';
        return false;
    }
}

// Fonction pour calculer la hauteur nécessaire du conteneur
function adjustContainerHeight() {
    const imgSize = parseInt(imageSizeInput.value);
    const totalImages = currentImagesData.length;
    
    // Calcul de l'espace requis (taille image + marge)
    // On multiplie par 3 pour laisser de l'espace vide pour l'effet aléatoire
    const areaPerImage = (imgSize + 20) * (imgSize + 20);
    const requiredArea = totalImages * areaPerImage * 3.0;
    
    const containerWidth = imageContainer.clientWidth;
    // Hauteur min de 400px
    const calculatedHeight = Math.max(400, requiredArea / containerWidth);
    
    imageContainer.style.height = `${calculatedHeight}px`;
}

// Étape 2: Sélectionner un sous-ensemble (Identique)
function selectSubsetImages() {
    const classCount = parseInt(classCountInput.value);
    const imagesPerClass = parseInt(imagesPerClassInput.value);
    
    const allCategories = [...new Set(allImagesData.map(data => data.category))];
    const selectedCategories = [];
    const shuffledCategories = [...allCategories].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(classCount, shuffledCategories.length); i++) {
        selectedCategories.push(shuffledCategories[i]);
    }
    
    currentImagesData = [];
    selectedCategories.forEach(category => {
        const categoryImages = allImagesData.filter(data => data.category === category);
        const shuffled = [...categoryImages].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, imagesPerClass);
        currentImagesData.push(...selected);
    });
    
    return currentImagesData.length;
}

// Étape 3: Créer les images
function createImages() {
    // 1. Cacher le bouton Load
    loadBtn.style.display = 'none';
    
    // 2. Nettoyer les anciennes images (sauf le bouton load qui est caché)
    document.querySelectorAll('.image-item, .cluster-label').forEach(el => el.remove());
    
    // 3. Ajuster la hauteur AVANT de créer les images
    adjustContainerHeight();

    const imageSize = parseInt(imageSizeInput.value);
    
    currentImagesData.forEach((data, index) => {
        const img = document.createElement('img');
        img.className = 'image-item';
        // URL absolue vers GitHub pour les images (ça ne change pas)
        img.src = `https://media.githubusercontent.com/media/Auregen/data-images/main/mains_raw/${data.imageName}`;
        img.alt = data.imageName;
        img.dataset.category = data.category;
        img.dataset.index = index;
        img.style.width = `${imageSize}px`;
        img.style.height = `${imageSize}px`;
        
        // Position initiale centrée pour effet d'explosion
        img.style.left = '50%';
        img.style.top = '50%';
        img.style.transform = 'translate(-50%, -50%) scale(0)';
        
        img.onerror = function() { this.style.display = 'none'; };
        imageContainer.appendChild(img);
    });
    
    statusText.textContent = `${currentImagesData.length} images générées`;
    randomizeBtn.disabled = false;
    clusterBtn.disabled = false;
    resetBtn.disabled = false; // Activer le Reset
}

// Étape 4: Disposition aléatoire
function randomizeLayout() {
    const containerRect = imageContainer.getBoundingClientRect();
    const images = document.querySelectorAll('.image-item');
    const imageSize = parseInt(imageSizeInput.value);
    
    images.forEach((img, i) => {
        const maxX = containerRect.width - imageSize - 20;
        const maxY = containerRect.height - imageSize - 20;
        
        const randomX = 10 + Math.random() * maxX;
        const randomY = 10 + Math.random() * maxY;
        
        setTimeout(() => {
            img.style.left = `${randomX}px`;
            img.style.top = `${randomY}px`;
            img.style.transform = 'scale(1)';
        }, i * 5);
    });
}

// Nouvelle fonction Reset
function resetApplication() {
    // Supprimer images et labels
    document.querySelectorAll('.image-item, .cluster-label').forEach(el => el.remove());
    
    // Réafficher le bouton Load
    loadBtn.style.display = 'block';
    
    // Remettre la hauteur normale
    imageContainer.style.height = 'auto';
    imageContainer.style.minHeight = '400px';
    
    // Désactiver boutons
    clusterBtn.disabled = true;
    resetBtn.disabled = true;
    statusText.textContent = 'Prêt à charger';
}

// Étape 5 & 6: Clusters (Identique)
function calculateClusterPositions() {
    const containerRect = imageContainer.getBoundingClientRect();
    const categories = [...new Set(currentImagesData.map(data => data.category))];
    const clusterPositions = {};
    
    const cols = Math.ceil(Math.sqrt(categories.length));
    const rows = Math.ceil(categories.length / cols);
    
    const clusterWidth = containerRect.width / cols;
    const clusterHeight = containerRect.height / rows;
    
    categories.forEach((category, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        clusterPositions[category] = {
            x: col * clusterWidth + clusterWidth * 0.1,
            y: row * clusterHeight + clusterHeight * 0.1,
            color: clusterColors[index % clusterColors.length]
        };
    });
    return clusterPositions;
}

function clusterImages() {
    const clusterPositions = calculateClusterPositions();
    const images = document.querySelectorAll('.image-item');
    const imageSize = parseInt(imageSizeInput.value);
    
    document.querySelectorAll('.cluster-label').forEach(l => l.remove());
    
    Object.keys(clusterPositions).forEach(category => {
        const cluster = clusterPositions[category];
        const label = document.createElement('div');
        label.className = 'cluster-label';
        label.textContent = `Classe ${category}`;
        label.style.left = `${cluster.x}px`;
        label.style.top = `${cluster.y}px`;
        label.style.background = cluster.color;
        imageContainer.appendChild(label);
    });
    
    const imagesByCategory = {};
    images.forEach(img => {
        const cat = img.dataset.category;
        if (!imagesByCategory[cat]) imagesByCategory[cat] = [];
        imagesByCategory[cat].push(img);
    });
    
    Object.keys(imagesByCategory).forEach(category => {
        const cluster = clusterPositions[category];
        const items = imagesByCategory[category];
        const itemsPerRow = Math.ceil(Math.sqrt(items.length));
        const spacing = imageSize + 15;
        
        items.forEach((img, index) => {
            const row = Math.floor(index / itemsPerRow);
            const col = index % itemsPerRow;
            const x = cluster.x + 25 + (col * spacing);
            const y = cluster.y + 40 + (row * spacing); // +40 pour laisser place au label
            
            setTimeout(() => {
                img.style.left = `${x}px`;
                img.style.top = `${y}px`;
                img.style.transform = 'scale(1)';
                img.style.borderColor = cluster.color;
            }, index * 20);
        });
    });
}

// Initialisation
async function init() {
    await loadAllCSV();
    
    loadBtn.addEventListener('click', () => {
        const total = selectSubsetImages();
        if (total > 0) {
            createImages();
            setTimeout(randomizeLayout, 100);
        }
    });
    
    randomizeBtn.addEventListener('click', randomizeLayout);
    clusterBtn.addEventListener('click', clusterImages);
    resetBtn.addEventListener('click', resetApplication);
    
    imageSizeInput.addEventListener('change', () => {
        if (currentImagesData.length > 0) {
            adjustContainerHeight();
            randomizeLayout();
        }
    });
}

init();