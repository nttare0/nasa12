// NASA API Configuration
const API_BASE = 'https://api.nasa.gov';

// State
let currentAPODDate = new Date();

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadSavedApiKey();
    setDefaultDates();
    fetchAPOD();
    populateCameraOptions();
});

// ============================================================
// NAVIGATION
// ============================================================

function setupNavigation() {
    const navBtns = document.querySelectorAll('.nav-btn');
    const sections = {
        apod: document.getElementById('apod-section'),
        gallery: document.getElementById('gallery-section'),
        mars: document.getElementById('mars-section'),
        neo: document.getElementById('neo-section')
    };

    navBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const section = btn.dataset.section;
            
            // Update buttons
            navBtns.forEach(b => {
                b.classList.remove('active');
                b.removeAttribute('aria-current');
            });
            btn.classList.add('active');
            btn.setAttribute('aria-current', 'page');
            
            // Update sections
            Object.values(sections).forEach(s => s.classList.remove('active'));
            sections[section].classList.add('active');
            
            // Reset scroll position
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    });
}

// ============================================================
// API KEY MANAGEMENT
// ============================================================

function loadSavedApiKey() {
    const savedKey = localStorage.getItem('nasaApiKey');
    if (savedKey) {
        document.getElementById('apiKey').value = savedKey;
    }
    
    // Set max date for date inputs to today
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('input[type="date"]').forEach(input => {
        if (!input.hasAttribute('min')) {
            input.setAttribute('max', today);
        }
    });
}

function saveApiKey() {
    const apiKey = document.getElementById('apiKey').value.trim();
    if (apiKey) {
        localStorage.setItem('nasaApiKey', apiKey);
    }
}

document.getElementById('saveKey').addEventListener('click', saveApiKey);

function getApiKey() {
    return document.getElementById('apiKey').value.trim() || 'DEMO_KEY';
}

// ============================================================
// DEFAULT DATES
// ============================================================

function setDefaultDates() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('earthDate').value = today;
    document.getElementById('neoStartDate').value = today;
    
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 7);
    document.getElementById('neoEndDate').value = endDate.toISOString().split('T')[0];
    
    // Gallery date range: last 30 days
    const galleryEnd = new Date();
    const galleryStart = new Date();
    galleryStart.setDate(galleryStart.getDate() - 30);
    document.getElementById('galleryStartDate').value = galleryStart.toISOString().split('T')[0];
    document.getElementById('galleryEndDate').value = galleryEnd.toISOString().split('T')[0];
    
    // Set min/max for gallery dates
    const minDate = '1995-06-16';
    document.getElementById('galleryStartDate').min = minDate;
    document.getElementById('galleryEndDate').min = minDate;
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function formatDate(date) {
    return date.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00'); // Ensure date-only parsing
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
}

function formatISO8601Date(dateStr) {
    return dateStr + 'T00:00:00';
}

function showElement(el) {
    if (el) el.style.display = '';
}

function hideElement(el) {
    if (el) el.style.display = 'none';
}

function showElements(els) {
    els.forEach(el => { if (el) el.style.display = ''; });
}

function hideElements(els) {
    els.forEach(el => { if (el) el.style.display = 'none'; });
}

// ============================================================
// APOD FUNCTIONS
// ============================================================

async function fetchAPOD(date = null) {
    const loader = document.getElementById('apodLoader');
    const content = document.getElementById('apodContent');
    const error = document.getElementById('apodError');
    
    hideElements([content, error]);
    showElement(loader);
    
    try {
        let url = `${API_BASE}/planetary/apod?api_key=${getApiKey()}`;
        if (date) {
            url += `&date=${formatDate(date)}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Unable to load image. Please check your API key or try again later.');
        }
        
        const data = await response.json();
        
        if (data.code && data.msg) {
            throw new Error(data.msg);
        }
        
        displayAPOD(data);
        hideElement(loader);
        showElement(content);
        
        // Update date display with proper ARIA
        const dateDisplay = document.getElementById('apodDateDisplay');
        const dateValue = data.date || formatDate(currentAPODDate);
        dateDisplay.textContent = formatDisplayDate(dateValue);
        dateDisplay.setAttribute('datetime', formatISO8601Date(dateValue));
        
        // Update image date caption
        const apodDateEl = document.getElementById('apodDate');
        apodDateEl.textContent = formatDisplayDate(dateValue);
        apodDateEl.setAttribute('datetime', formatISO8601Date(dateValue));
        
    } catch (err) {
        hideElement(loader);
        showElement(error);
        document.getElementById('apodErrorMsg').textContent = err.message;
    }
}

function displayAPOD(data) {
    const imageEl = document.getElementById('apodImage');
    const titleEl = document.getElementById('apodTitle');
    const copyrightEl = document.getElementById('apodCopyright');
    const explanationEl = document.getElementById('apodExplanation');
    const hoverLinkEl = document.getElementById('apodHoverLink');
    const infoLinkEl = document.getElementById('apodInfoLink');
    
    // Set image with alt text
    imageEl.src = data.url;
    imageEl.alt = data.title || 'Astronomy Picture of the Day';
    
    // Show full size link only for images
    if (data.media_type === 'image') {
        hoverLinkEl.style.display = '';
        hoverLinkEl.href = data.hdurl || data.url;
    } else {
        hoverLinkEl.style.display = 'none';
    }
    
    // Set content
    titleEl.textContent = data.title || 'Untitled';
    
    if (data.copyright) {
        copyrightEl.textContent = `Credit: ${data.copyright}`;
        copyrightEl.style.display = '';
    } else {
        copyrightEl.style.display = 'none';
    }
    
    explanationEl.textContent = data.explanation || 'No description available.';
    
    hoverLinkEl.href = data.hdurl || data.url;
    infoLinkEl.href = data.url;
    
    currentAPODDate = data.date ? new Date(data.date + 'T00:00:00') : currentAPODDate;
}

function fetchPreviousAPOD() {
    const prevDate = new Date(currentAPODDate);
    prevDate.setDate(prevDate.getDate() - 1);
    
    // Limit: NASA only has data from 1995-06-16
    if (prevDate >= new Date('1995-06-16')) {
        fetchAPOD(prevDate);
    }
}

function fetchNextAPOD() {
    const nextDate = new Date(currentAPODDate);
    nextDate.setDate(nextDate.getDate() + 1);
    
    // Can't go beyond today
    if (nextDate <= new Date()) {
        fetchAPOD(nextDate);
    }
}

// ============================================================
// GALLERY FUNCTIONS
// ============================================================

async function fetchGallery(event = null) {
    if (event) {
        event.preventDefault();
    }
    
    const form = document.querySelector('.gallery-filters');
    const formData = new FormData(form);
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    
    const loader = document.getElementById('galleryLoader');
    const grid = document.getElementById('galleryGrid');
    const empty = document.getElementById('galleryEmpty');
    
    // Validate dates
    if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
    }
    
    if (new Date(endDate + 'T00:00:00') < new Date(startDate + 'T00:00:00')) {
        alert('End date must be after start date.');
        return;
    }
    
    // Limit to 30 days max per request
    const daysDiff = Math.ceil((new Date(endDate + 'T00:00:00') - new Date(startDate + 'T00:00:00')) / (1000 * 60 * 60 * 24));
    if (daysDiff > 30) {
        alert('Please select a date range of 30 days or less for best performance.');
        return;
    }
    
    hideElements([empty]);
    showElement(loader);
    grid.innerHTML = '';
    
    try {
        const images = [];
        const currentDate = new Date(startDate + 'T00:00:00');
        const endDateObj = new Date(endDate + 'T00:00:00');
        
        // Fetch each day individually (APOD endpoint doesn't support date ranges)
        while (currentDate <= endDateObj) {
            const dateStr = formatDate(currentDate);
            try {
                const url = `${API_BASE}/planetary/apod?api_key=${getApiKey()}&date=${dateStr}`;
                const response = await fetch(url);
                
                if (response.ok) {
                    const data = await response.json();
                    if (data.media_type === 'image' && data.url) {
                        images.push({
                            date: data.date,
                            title: data.title,
                            url: data.url,
                            hdurl: data.hdurl
                        });
                    }
                }
            } catch (e) {
                // Skip days that fail to load
                console.warn(`Failed to load APOD for ${dateStr}:`, e);
            }
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        if (images.length > 0) {
            displayGallery(images);
        } else {
            showElement(empty);
        }
        
    } catch (err) {
        showElement(empty);
    } finally {
        hideElement(loader);
    }
}

function displayGallery(images) {
    const grid = document.getElementById('galleryGrid');
    grid.innerHTML = '';
    
    // Limit to 50 images for performance
    const limitedImages = images.slice(0, 50);
    
    limitedImages.forEach((img, index) => {
        const item = document.createElement('article');
        item.className = 'gallery-item';
        item.setAttribute('tabindex', '0');
        item.setAttribute('role', 'button');
        item.setAttribute('aria-label', `View ${img.title} from ${formatDisplayDate(img.date)}`);
        
        item.innerHTML = `
            <img src="${img.url}" alt="${img.title}" class="gallery-image" loading="lazy">
            <div class="gallery-item-info">
                <h3 class="gallery-title">${escapeHtml(img.title)}</h3>
                <span class="gallery-date">${formatDisplayDate(img.date)}</span>
            </div>
        `;
        
        item.addEventListener('click', () => {
            navigateToAPOD(img.date);
        });
        
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                navigateToAPOD(img.date);
            }
        });
        
        grid.appendChild(item);
    });
}

function navigateToAPOD(dateStr) {
    // Switch to APOD section
    document.querySelectorAll('.nav-btn').forEach(b => {
        b.classList.remove('active');
        b.removeAttribute('aria-current');
    });
    document.querySelector('[data-section="apod"]').classList.add('active');
    document.querySelector('[data-section="apod"]').setAttribute('aria-current', 'page');
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById('apod-section').classList.add('active');
    
    // Load the selected date
    fetchAPOD(new Date(dateStr + 'T00:00:00'));
    
    // Update URL hash
    window.location.hash = `date=${dateStr}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ============================================================
// MARS ROVER FUNCTIONS
// ============================================================

async function populateCameraOptions() {
    const cameras = ['FHAZ', 'RHAZ', 'MAST', 'CHEMCAM', 'MAHLI', 'MARDI', 'NAVCAM', 'PANCAM', 'MINITES'];
    const select = document.getElementById('cameraSelect');
    
    const cameraNames = {
        FHAZ: 'Front Hazard Avoidance Camera',
        RHAZ: 'Rear Hazard Avoidance Camera',
        MAST: 'Mast Camera',
        CHEMCAM: 'Chemistry and Camera Complex',
        MAHLI: 'Mars Hand Lens Imager',
        MARDI: 'Mars Descent Imager',
        NAVCAM: 'Navigation Camera',
        PANCAM: 'Panoramic Camera',
        MINITES: 'Miniature Thermal Emission Spectrometer'
    };
    
    cameras.forEach(camera => {
        const option = document.createElement('option');
        option.value = camera;
        option.textContent = cameraNames[camera] || camera;
        select.appendChild(option);
    });
}

async function fetchMarsPhotos(event = null) {
    if (event) {
        event.preventDefault();
    }
    
    const form = document.querySelector('.mars-filters');
    const formData = new FormData(form);
    const rover = formData.get('rover');
    const camera = formData.get('camera');
    const earthDate = formData.get('earthDate');
    
    const loader = document.getElementById('marsLoader');
    const grid = document.getElementById('marsGrid');
    const error = document.getElementById('marsError');
    const empty = document.getElementById('marsEmpty');
    
    hideElements([error, empty]);
    showElement(loader);
    grid.innerHTML = '';
    
    try {
        let url = `${API_BASE}/mars-photos/api/v1/rovers/${rover}/photos?earth_date=${earthDate}&api_key=${getApiKey()}`;
        if (camera) {
            url += `&camera=${camera}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Unable to load Mars photos. Please check your API key or try again later.');
        }
        
        const data = await response.json();
        
        if (data.photos && data.photos.length > 0) {
            displayMarsPhotos(data.photos);
        } else {
            showElement(empty);
        }
        
    } catch (err) {
        showElement(error);
        document.getElementById('marsErrorMsg').textContent = err.message;
    } finally {
        hideElement(loader);
    }
}

function displayMarsPhotos(photos) {
    const grid = document.getElementById('marsGrid');
    grid.innerHTML = '';
    
    // Limit to 12 photos
    const limitedPhotos = photos.slice(0, 12);
    
    limitedPhotos.forEach(photo => {
        const card = document.createElement('article');
        card.className = 'photo-card';
        
        const cameraFullName = getCameraFullName(photo.rover.name, photo.camera.name);
        
        card.innerHTML = `
            <img src="${photo.img_src}" alt="Mars photo from ${photo.camera.name} camera" class="photo-image" loading="lazy">
            <div class="photo-info">
                <div class="photo-camera">${escapeHtml(cameraFullName)}</div>
                <div class="photo-meta">Sol ${photo.sol} · ${formatDisplayDate(photo.earth_date)}</div>
            </div>
        `;
        
        grid.appendChild(card);
    });
}

function getCameraFullName(rover, camera) {
    const names = {
        'Front Hazard Avoidance Camera': 'Front Hazard',
        'Rear Hazard Avoidance Camera': 'Rear Hazard',
        'Mast Camera': 'Mastcam',
        'Chemistry and Camera Complex': 'ChemCam',
        'Mars Hand Lens Imager': 'MAHLI',
        'Navigation Camera': 'Navcam',
        'Panoramic Camera': 'Pancam'
    };
    return names[camera] || camera;
}

// ============================================================
// NEO FUNCTIONS
// ============================================================

async function fetchNEO(event = null) {
    if (event) {
        event.preventDefault();
    }
    
    const form = document.querySelector('.neo-filters');
    const formData = new FormData(form);
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    
    const loader = document.getElementById('neoLoader');
    const grid = document.getElementById('neoGrid');
    const error = document.getElementById('neoError');
    const summary = document.getElementById('neoSummary');
    const empty = document.getElementById('neoEmpty');
    
    if (!startDate || !endDate) {
        alert('Please select both start and end dates.');
        return;
    }
    
    if (new Date(endDate + 'T00:00:00') < new Date(startDate + 'T00:00:00')) {
        alert('End date must be after start date.');
        return;
    }
    
    hideElements([error, summary, empty]);
    showElement(loader);
    grid.innerHTML = '';
    
    try {
        const url = `${API_BASE}/neo/rest/v1/feed?start_date=${startDate}&end_date=${endDate}&api_key=${getApiKey()}`;
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Unable to load near Earth object data. Please check your API key or try again later.');
        }
        
        const data = await response.json();
        
        if (data.element_count > 0) {
            displayNEO(data.near_earth_objects);
            showElement(summary);
            
            document.getElementById('neoCount').textContent = data.element_count;
            
            const hazardousCount = Object.values(data.near_earth_objects).filter(
                objects => objects.some(o => o.is_potentially_hazardous_asteroid)
            ).length;
            document.getElementById('neoPotentiallyHazardous').textContent = hazardousCount;
        } else {
            showElement(empty);
        }
        
    } catch (err) {
        showElement(error);
        document.getElementById('neoErrorMsg').textContent = err.message;
    } finally {
        hideElement(loader);
    }
}

function displayNEO(neoData) {
    const grid = document.getElementById('neoGrid');
    grid.innerHTML = '';
    
    // Flatten all objects
    const allObjects = [];
    Object.values(neoData).forEach(objects => {
        objects.forEach(obj => {
            allObjects.push(obj);
        });
    });
    
    // Sort by diameter (largest first) and limit
    allObjects.sort((a, b) => b.estimated_diameter.kilometers.estimated_diameter_max - 
                             a.estimated_diameter.kilometers.estimated_diameter_max);
    const limitedObjects = allObjects.slice(0, 20);
    
    limitedObjects.forEach(obj => {
        const item = document.createElement('article');
        item.className = 'neo-item';
        
        const hazardous = obj.is_potentially_hazardous_asteroid;
        const maxDiameter = obj.estimated_diameter.kilometers.estimated_diameter_max;
        const minDiameter = obj.estimated_diameter.kilometers.estimated_diameter_min;
        const closeApproach = obj.close_approach_data[0];
        
        item.innerHTML = `
            <div>
                <h3 class="neo-name">${escapeHtml(obj.name)}</h3>
                <div class="neo-details">
                    <div class="neo-detail">
                        <span class="neo-detail-label">Diameter</span>
                        <span class="neo-detail-value">${minDiameter.toFixed(3)} - ${maxDiameter.toFixed(3)} km</span>
                    </div>
                    <div class="neo-detail">
                        <span class="neo-detail-label">Miss Distance</span>
                        <span class="neo-detail-value">${formatDistance(closeApproach.miss_distance.kilometers)} km</span>
                    </div>
                    <div class="neo-detail">
                        <span class="neo-detail-label">Relative Speed</span>
                        <span class="neo-detail-value">${formatSpeed(closeApproach.relative_velocity.kilometers_per_second)} km/s</span>
                    </div>
                    <div class="neo-detail">
                        <span class="neo-detail-label">Approach Date</span>
                        <span class="neo-detail-value">${formatDisplayDate(closeApproach.close_approach_date)}</span>
                    </div>
                </div>
            </div>
            <span class="neo-badge ${hazardous ? 'hazardous' : 'safe'}" role="status">
                ${hazardous ? 'Potentially Hazardous' : 'Safe'}
            </span>
        `;
        
        grid.appendChild(item);
    });
}

function formatDistance(km) {
    if (km >= 1000000) {
        return (km / 1000000).toFixed(2) + ' million';
    } else if (km >= 1000) {
        return (km / 1000).toFixed(1) + 'K';
    }
    return km.toFixed(0);
}

function formatSpeed(kps) {
    return parseFloat(kps).toFixed(2);
}

// ============================================================
// KEYBOARD SHORTCUTS
// ============================================================

document.addEventListener('keydown', (e) => {
    // Ignore if typing in a form field
    if (e.target.matches('input, select, textarea')) {
        return;
    }
    
    const apodActive = document.querySelector('#apod-section.active');
    
    if (apodActive) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            fetchPreviousAPOD();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            fetchNextAPOD();
        }
    }
    
    // 'G' key to go to gallery
    if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        document.querySelector('[data-section="gallery"]').click();
    }
});
