
// Variables globales
let allImagesData = [];
let currentImagesData = [];
const imageContainer = document.getElementById('image-container');
const loadBtn = document.getElementById('loadBtn');
const randomizeBtn = document.getElementById('randomizeBtn');
const clusterBtn = document.getElementById('clusterBtn');
const statusText = document.getElementById('statusText');
const classCountInput = document.getElementById('classCount');
const imagesPerClassInput = document.getElementById('imagesPerClass');
const imageSizeInput = document.getElementById('imageSize');

// Couleurs inspirées de votre site
const clusterColors = [
    '#B585B8', '#8BBD8F', '#B68E87', '#868AB8', '#84B8B7',
    '#CD6D4E', '#3592B1', '#8F877B', '#DDA0DD', '#98D8C8'
];

// Étape 1: Charger le fichier CSV
async function loadAllCSV() {
    try {
        statusText.textContent = 'Chargement du CSV complet...';
        const response = await fetch('dataset.csv');
        const csvText = await response.text();
        
        // Parser le CSV
        const lines = csvText.split('\n');
        allImagesData = [];

        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (line) {
                const values = line.split(',');
                if (values.length >= 2) {
                    allImagesData.push({
                        imageName: values[0].trim(),
                        category: values[1].trim()
                    });
                }
            }
        }
        
        statusText.textContent = `CSV chargé: ${allImagesData.length} images disponibles`;
        return true;
    } catch (error) {
        console.error('Erreur lors du chargement du CSV:', error);
        statusText.textContent = 'Erreur lors du chargement du CSV';
        return false;
    }
}

// Étape 2: Sélectionner un sous-ensemble d'images
function selectSubsetImages() {
    const classCount = parseInt(classCountInput.value);
    const imagesPerClass = parseInt(imagesPerClassInput.value);
    
    // Obtenir toutes les catégories disponibles
    const allCategories = [...new Set(allImagesData.map(data => data.category))];
    
    // Sélectionner aléatoirement N catégories
    const selectedCategories = [];
    const shuffledCategories = [...allCategories].sort(() => 0.5 - Math.random());
    
    for (let i = 0; i < Math.min(classCount, shuffledCategories.length); i++) {
        selectedCategories.push(shuffledCategories[i]);
    }
    
    // Pour chaque catégorie sélectionnée, prendre M images aléatoires
    currentImagesData = [];
    selectedCategories.forEach(category => {
        const categoryImages = allImagesData.filter(data => data.category === category);
        const shuffled = [...categoryImages].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, imagesPerClass);
        currentImagesData.push(...selected);
    });
    
    return currentImagesData.length;
}

// Étape 3: Créer et afficher les images
function createImages() {
    statusText.textContent = 'Création des images...';
    imageContainer.innerHTML = '';
    
    const imageSize = parseInt(imageSizeInput.value);
    
    currentImagesData.forEach((data, index) => {
        const img = document.createElement('img');
        img.className = 'image-item';
        img.src = `https://media.githubusercontent.com/media/Auregen/data-images/main/mains_raw/${data.imageName}`;        img.alt = data.imageName;
        img.dataset.category = data.category;
        img.dataset.index = index;
        img.style.width = `${imageSize}px`;
        img.style.height = `${imageSize}px`;
        
        // Gestion des erreurs de chargement d'image
        img.onerror = function() {
            this.style.display = 'none';
            console.warn(`Image non trouvée: ${data.imageName}`);
        };
        
        imageContainer.appendChild(img);
    });
    
    statusText.textContent = `${currentImagesData.length} images créées - Prêt pour la disposition aléatoire`;
    randomizeBtn.disabled = false;
    clusterBtn.disabled = false;
}

// Étape 4: Disposition aléatoire
function randomizeLayout() {
    statusText.textContent = 'Disposition aléatoire...';
    
    const containerRect = imageContainer.getBoundingClientRect();
    const images = document.querySelectorAll('.image-item');
    const imageSize = parseInt(imageSizeInput.value);
    
    images.forEach(img => {
        // Position aléatoire dans le conteneur
        const maxX = containerRect.width - imageSize - 40;
        const maxY = containerRect.height - imageSize - 40;
        
        const randomX = 20 + Math.random() * maxX;
        const randomY = 20 + Math.random() * maxY;
        
        img.style.left = `${randomX}px`;
        img.style.top = `${randomY}px`;
        img.style.transform = 'scale(1)';
    });
    
    statusText.textContent = 'Disposition aléatoire terminée';
}

// Étape 5: Calculer les positions des clusters
function calculateClusterPositions() {
    const containerRect = imageContainer.getBoundingClientRect();
    const categories = [...new Set(currentImagesData.map(data => data.category))];
    const clusterPositions = {};
    
    // Disposition en grille pour les clusters
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
            width: clusterWidth * 0.8,
            height: clusterHeight * 0.8,
            color: clusterColors[index % clusterColors.length]
        };
    });
    
    return clusterPositions;
}

// Étape 6: Animation vers les clusters
function clusterImages() {
    statusText.textContent = 'Formation des clusters...';
    
    const clusterPositions = calculateClusterPositions();
    const images = document.querySelectorAll('.image-item');
    const imageSize = parseInt(imageSizeInput.value);
    
    // Nettoyer les anciens labels
    document.querySelectorAll('.cluster-label').forEach(label => label.remove());
    
    // Ajouter les labels de clusters
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
    
    // Regrouper les images par catégorie
    const imagesByCategory = {};
    images.forEach(img => {
        const category = img.dataset.category;
        if (!imagesByCategory[category]) {
            imagesByCategory[category] = [];
        }
        imagesByCategory[category].push(img);
    });
    
    // Positionner les images dans leurs clusters
    Object.keys(imagesByCategory).forEach(category => {
        const cluster = clusterPositions[category];
        const categoryImages = imagesByCategory[category];
        
        // Disposition en grille à l'intérieur du cluster
        const imagesPerRow = Math.ceil(Math.sqrt(categoryImages.length));
        const spacing = imageSize + 15;
        
        categoryImages.forEach((img, index) => {
            const row = Math.floor(index / imagesPerRow);
            const col = index % imagesPerRow;
            
            const x = cluster.x + 25 + (col * spacing);
            const y = cluster.y + 25 + (row * spacing);
            
            // Animation vers la nouvelle position
            setTimeout(() => {
                img.style.left = `${x}px`;
                img.style.top = `${y}px`;
                img.style.transform = 'scale(1)';
                img.style.borderColor = cluster.color;
            }, index * 30); // Délai progressif pour un effet cascade
        });
    });
    
    statusText.textContent = `Clusters formés: ${Object.keys(imagesByCategory).length} catégories`;
}

// Étape 7: Initialisation
async function init() {
    // Charger d'abord tout le CSV
    await loadAllCSV();
    
    // Événement pour le bouton de chargement
    loadBtn.addEventListener('click', () => {
        const totalImages = selectSubsetImages();
        if (totalImages > 0) {
            createImages();
            setTimeout(randomizeLayout, 500);
        }
    });
    
    // Événements des autres boutons
    randomizeBtn.addEventListener('click', randomizeLayout);
    clusterBtn.addEventListener('click', clusterImages);
    
    // Mettre à jour la taille des images quand elle change
    imageSizeInput.addEventListener('change', () => {
        const images = document.querySelectorAll('.image-item');
        const newSize = parseInt(imageSizeInput.value);
        images.forEach(img => {
            img.style.width = `${newSize}px`;
            img.style.height = `${newSize}px`;
        });
    });
}

// Démarrer l'application
init();
