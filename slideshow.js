// slideshow.js

import { createClient } from '@supabase/supabase-js';

// Supabase Configuration - REPLACE WITH YOUR CREDENTIALS
const SUPABASE_URL = 'https://dtjqnrcdduvluddsmmex.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0anFucmNkZHV2bHVkZHNtbWV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNzc1MjcsImV4cCI6MjA3OTc1MzUyN30.5ifWxyBhYPF_WPv_aNJoOba1kWGq4zQM6PxU4JD7N9U';
const FILE_NAME = 'ACCSM_0.1.0_x64-setup.exe'; // Replace with your actual file name

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Slideshow data (Initial mock data)
const slidesData = [
    { title: "Overview", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.", image: "./images/image1.png" },
    { title: "Import Setups & Files", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.", image: "./images/image2.png" },
    { title: "Simplify Names", description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum.", image: "./images/image3.png" } // Fixed typo in path
];

let currentSlide = 0;

const carouselTrack = document.getElementById('carousel-track');
const slideTitle = document.getElementById('slide-title');
const slideDescription = document.getElementById('slide-description');
const slideIndicatorsContainer = document.getElementById('slide-indicators');
const downloadBtn = document.getElementById('download-btn');
const statusMsg = document.getElementById('status-msg');
const prevBtnIcon = document.getElementById('prev-btn-icon');
const nextBtnIcon = document.getElementById('next-btn-icon');
const slideContent = document.getElementById('slide-content');
const uploadInput = document.getElementById('screenshot-upload');
const placeholderSlide = document.getElementById('placeholder-slide');


/**
 * Initializes the carousel elements and event listeners.
 */
function initCarousel() {
    // 1. Render all slides and remove placeholder
    slidesData.forEach((slide, index) => {
        const slideElement = document.createElement('div');
        slideElement.className = 'carousel-item w-full h-full';
        // Check if the image path is valid, otherwise use a placeholder background
        const imgSrc = slide.image && !slide.image.endsWith('imag') ? slide.image : 'placeholder_image.png'; 
        
        // No explicit formatting, blending is expected via external CSS/background
        slideElement.innerHTML = `<img src="${imgSrc}" alt="${slide.title}" class="w-full h-full object-contain">`;
        carouselTrack.appendChild(slideElement);
    });
    
    // Remove the initial placeholder once real slides are added
    if (placeholderSlide) {
        placeholderSlide.remove();
    }

    // 2. Render indicators
    slideIndicatorsContainer.innerHTML = '';
    slidesData.forEach((_, index) => {
        const indicator = document.createElement('button');
        indicator.className = 'slide-indicator w-2 h-2 rounded-full transition-colors';
        indicator.addEventListener('click', () => setSlide(index));
        slideIndicatorsContainer.appendChild(indicator);
    });

    // 3. Set initial slide and attach navigation listeners
    updateSlide();
    prevBtnIcon.addEventListener('click', () => navigateSlide(-1));
    nextBtnIcon.addEventListener('click', () => navigateSlide(1));
    uploadInput.addEventListener('change', handleScreenshotUpload);
    downloadBtn.addEventListener('click', handleDownload);
}

/**
 * Changes the current slide by a relative amount.
 * @param {number} direction - -1 for previous, 1 for next.
 */
function navigateSlide(direction) {
    let newSlide = currentSlide + direction;
    if (newSlide < 0) newSlide = slidesData.length - 1; // Loop back or just stop
    if (newSlide >= slidesData.length) newSlide = 0; // Loop back or just stop
    
    // Check for bounds if no loop
    if (newSlide >= 0 && newSlide < slidesData.length) {
        setSlide(newSlide);
    }
}

/**
 * Sets the carousel to a specific slide index.
 * @param {number} index - The index of the slide to show.
 */
function setSlide(index) {
    if (index === currentSlide || index < 0 || index >= slidesData.length) return;
    currentSlide = index;
    updateSlide();
}

/**
 * Updates the display elements for the current slide.
 */
function updateSlide() {
    const slides = carouselTrack.querySelectorAll('.carousel-item');
    const indicators = slideIndicatorsContainer.querySelectorAll('.slide-indicator');

    const currentData = slidesData[currentSlide];

    // 1. Update text content with animation
    slideContent.classList.remove('fade-in');
    void slideContent.offsetWidth; // Trigger reflow to restart animation
    slideContent.classList.add('fade-in');
    
    slideTitle.textContent = currentData.title;
    slideDescription.textContent = currentData.description;

    // 2. Update slides
    slides.forEach((slide, index) => {
        slide.classList.remove('active');
        if (index === currentSlide) {
            slide.classList.add('active');
        }
    });

    // 3. Update indicators
    indicators.forEach((ind, index) => {
        // Use bg-primary for active, bg-muted for inactive
        ind.className = index === currentSlide 
            ? 'slide-indicator w-2 h-2 rounded-full bg-primary transition-colors' 
            : 'slide-indicator w-2 h-2 rounded-full bg-muted transition-colors';
    });

    // 4. Update navigation buttons state
    prevBtnIcon.disabled = currentSlide === 0;
    nextBtnIcon.disabled = currentSlide === slidesData.length - 1;
}

/**
 * Handles the local upload of screenshots (for testing/mocking).
 */
function handleScreenshotUpload(e) {
    const files = Array.from(e.target.files).slice(0, slidesData.length);
    let imagesLoaded = 0;

    files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (event) => {
            slidesData[index].image = event.target.result;
            imagesLoaded++;
            
            if (imagesLoaded === files.length) {
                // Re-initialize carousel with new images
                initCarousel(); 
                setSlide(0);
            }
        };
        reader.readAsDataURL(file);
    });
}

/**
 * Handles the download process, including Supabase call and download count update.
 */
async function handleDownload() {
    // Save original content for restoration
    const originalBtnText = downloadBtn.innerHTML;
    
    downloadBtn.disabled = true;
    downloadBtn.innerHTML = `
        <svg class="animate-spin w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg> 
        Downloading...
    `;
    statusMsg.textContent = 'Starting download...';
    statusMsg.className = 'text-center text-xs text-muted-foreground mt-4';
    
    try {
        // 1. Download the file
        const { data, error: downloadError } = await supabase
            .storage
            .from('downloadables') // Replace with your bucket name
            .download(FILE_NAME);
        
        if (downloadError) throw downloadError;
        
        // 2. Increment download count (Fire and forget, no need to wait for error)
        supabase
            .from('download_counts')
            .update({ count: supabase.rpc('increment', { x: 1 }) })
            .eq('file_name', FILE_NAME)
            .then(({ error: updateError }) => {
                if (updateError) console.error('Count update error:', updateError);
            });
        
        // 3. Trigger browser download
        const url = window.URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = FILE_NAME;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        statusMsg.textContent = 'Download complete! Check your downloads folder.';
        statusMsg.className = 'text-center text-xs text-green-500 mt-4';
    } catch (error) {
        console.error('Download error:', error);
        statusMsg.textContent = 'Download failed. Please check console for details.';
        statusMsg.className = 'text-center text-xs text-red-500 mt-4';
    } finally {
        downloadBtn.disabled = false;
        downloadBtn.innerHTML = originalBtnText;
        setTimeout(() => {
            statusMsg.textContent = '';
            statusMsg.className = 'text-center text-xs text-muted-foreground mt-4';
        }, 5000);
    }
}

// Start the carousel when the script loads
document.addEventListener('DOMContentLoaded', initCarousel);
