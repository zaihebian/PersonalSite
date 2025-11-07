// ============================================
// VIDEO SPLASH SCREEN
// ============================================

let hasTransitioned = false;

function showMainContent() {
    if (hasTransitioned) {
        return;
    }
    hasTransitioned = true;
    
    console.log('=== TRANSITIONING TO MAIN CONTENT ===');
    
    const videoSplash = document.getElementById('videoSplash');
    const mainContent = document.getElementById('mainContent');
    const canvas = document.getElementById('particleCanvas');
    
    // Start particle background
    if (canvas) {
        new ParticleBackground(canvas);
    }
    
    // Show main content and hide video
    if (mainContent) {
        mainContent.classList.add('show');
    }
    if (videoSplash) {
        videoSplash.classList.add('hidden');
    }
    
    console.log('Transition complete!');
}

function initVideoSplash() {
    const videoSplash = document.getElementById('videoSplash');
    const mainContent = document.getElementById('mainContent');
    const introVideo = document.getElementById('introVideo');
    
    console.log('=== INITIALIZING VIDEO SPLASH ===');
    console.log('Elements:', { videoSplash: !!videoSplash, mainContent: !!mainContent, introVideo: !!introVideo });
    
    if (!videoSplash || !mainContent || !introVideo) {
        console.log('Missing elements, showing content');
        if (mainContent) mainContent.classList.add('show');
        const canvas = document.getElementById('particleCanvas');
        if (canvas) new ParticleBackground(canvas);
        return;
    }
    
    // PRIMARY: Video ended event
    introVideo.addEventListener('ended', function() {
        console.log('=== VIDEO ENDED EVENT ===');
        showMainContent();
    });
    
    // BACKUP 1: Aggressive interval check every 100ms
    const checkInterval = setInterval(() => {
        if (hasTransitioned) {
            clearInterval(checkInterval);
            return;
        }
        
        if (introVideo.ended) {
            console.log('=== Video ended (interval) ===');
            clearInterval(checkInterval);
            showMainContent();
        } else if (introVideo.duration > 0) {
            const remaining = introVideo.duration - introVideo.currentTime;
            if (remaining <= 0.1) {
                console.log('=== Video at end (remaining: ' + remaining.toFixed(2) + 's) ===');
                clearInterval(checkInterval);
                showMainContent();
            }
        }
    }, 100);
    
    // BACKUP 2: timeupdate event
    introVideo.addEventListener('timeupdate', function() {
        if (!hasTransitioned && introVideo.duration > 0) {
            const remaining = introVideo.duration - introVideo.currentTime;
            if (remaining <= 0.2) {
                console.log('=== Video near end (timeupdate) ===');
                showMainContent();
            }
        }
    });
    
    // BACKUP 3: Error handling
    introVideo.addEventListener('error', function(e) {
        console.log('Video error:', e);
        setTimeout(showMainContent, 1000);
    });
    
    // Debug: Log progress
    setInterval(() => {
        if (!hasTransitioned && introVideo.duration > 0) {
            const progress = ((introVideo.currentTime / introVideo.duration) * 100).toFixed(1);
            console.log(`Video: ${progress}% (${introVideo.currentTime.toFixed(1)}/${introVideo.duration.toFixed(1)}s)`);
        }
    }, 2000);
}

// TEST BUTTON - Remove after testing
document.addEventListener('DOMContentLoaded', () => {
    const testBtn = document.getElementById('testTransition');
    if (testBtn) {
        testBtn.addEventListener('click', () => {
            console.log('TEST BUTTON CLICKED - Forcing transition');
            showMainContent();
        });
    }
});

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing video...');
    initVideoSplash();
});

// Also try on window load
window.addEventListener('load', () => {
    console.log('Window loaded');
    const introVideo = document.getElementById('introVideo');
    if (introVideo) {
        introVideo.play().catch(err => console.log('Play error:', err));
    }
    setTimeout(initVideoSplash, 500);
});

// ============================================
// PARTICLE BACKGROUND
// ============================================

class ParticleBackground {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 100;
        this.mouse = { x: 0, y: 0 };
        
        this.init();
        this.animate();
        this.setupEventListeners();
    }
    
    init() {
        this.resize();
        this.createParticles();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    createParticles() {
        this.particles = [];
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                radius: Math.random() * 2 + 0.5,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                opacity: Math.random() * 0.5 + 0.2
            });
        }
    }
    
    drawParticle(particle) {
        this.ctx.beginPath();
        this.ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        this.ctx.fillStyle = `rgba(255, 107, 53, ${particle.opacity})`;
        this.ctx.fill();
    }
    
    drawConnection(p1, p2, distance) {
        const opacity = (1 - distance / 150) * 0.3;
        if (opacity > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(p1.x, p1.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.strokeStyle = `rgba(0, 212, 255, ${opacity})`;
            this.ctx.lineWidth = 0.5;
            this.ctx.stroke();
        }
    }
    
    updateParticles() {
        this.particles.forEach(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 100) {
                const force = (100 - distance) / 100;
                particle.vx -= (dx / distance) * force * 0.01;
                particle.vy -= (dy / distance) * force * 0.01;
            }
            
            if (particle.x < 0 || particle.x > this.canvas.width) particle.vx *= -1;
            if (particle.y < 0 || particle.y > this.canvas.height) particle.vy *= -1;
            
            particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
        });
    }
    
    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateParticles();
        
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 150) {
                    this.drawConnection(this.particles[i], this.particles[j], distance);
                }
            }
        }
        
        this.particles.forEach(particle => this.drawParticle(particle));
        
        requestAnimationFrame(() => this.animate());
    }
    
    setupEventListeners() {
        window.addEventListener('resize', () => {
            this.resize();
            this.createParticles();
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
    }
}

// ============================================
// SMOOTH SCROLL ANIMATIONS
// ============================================

const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, observerOptions);

document.querySelectorAll('section:not(.hero-section)').forEach(section => {
    observer.observe(section);
});

// ============================================
// SMOOTH SCROLL FOR NAVIGATION LINKS
// ============================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            // Get navbar height dynamically
            const nav = document.querySelector('.nav-container');
            const navHeight = nav ? nav.offsetHeight : 80;
            // Add extra padding for about section to prevent overlap with hero
            const extraPadding = target.id === 'about' ? 60 : 20;
            const offsetTop = target.offsetTop - navHeight - extraPadding;
            window.scrollTo({
                top: Math.max(0, offsetTop), // Ensure we don't scroll to negative values
                behavior: 'smooth'
            });
        }
    });
});

// ============================================
// TERMINAL TYPING ANIMATION
// ============================================

function initTerminalAnimation() {
    const typingCommand = document.querySelector('.terminal-command.typing');
    if (!typingCommand) return;
    
    const text = typingCommand.textContent;
    typingCommand.textContent = '';
    typingCommand.style.width = '0';
    
    let i = 0;
    const typeInterval = setInterval(() => {
        if (i < text.length) {
            typingCommand.textContent += text.charAt(i);
            i++;
        } else {
            clearInterval(typeInterval);
        }
    }, 50);
}

const terminalObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            setTimeout(initTerminalAnimation, 500);
            terminalObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

const terminalSection = document.querySelector('.terminal-section');
if (terminalSection) {
    terminalObserver.observe(terminalSection);
}

// ============================================
// CONTACT FORM HANDLING (MOCKUP)
// ============================================

const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const submitButton = contactForm.querySelector('.submit-button');
        const originalText = submitButton.textContent;
        
        submitButton.textContent = 'Sending...';
        submitButton.disabled = true;
        
        setTimeout(() => {
            submitButton.textContent = 'Message Sent!';
            submitButton.style.background = 'linear-gradient(135deg, #27c93f, #00d4ff)';
            
            setTimeout(() => {
                submitButton.textContent = originalText;
                submitButton.disabled = false;
                submitButton.style.background = '';
                contactForm.reset();
            }, 2000);
        }, 1500);
    });
}

// ============================================
// NAVBAR SCROLL EFFECT
// ============================================

let lastScroll = 0;
const navContainer = document.querySelector('.nav-container');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navContainer.style.background = 'rgba(15, 15, 30, 0.95)';
        navContainer.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navContainer.style.background = 'rgba(15, 15, 30, 0.8)';
        navContainer.style.boxShadow = 'none';
    }
    
    lastScroll = currentScroll;
});

// ============================================
// PARALLAX EFFECT FOR HERO SECTION
// ============================================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    const hero3d = document.querySelector('.hero-3d-element');
    
    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        heroContent.style.opacity = 1 - (scrolled / window.innerHeight) * 0.5;
    }
    
    if (hero3d && scrolled < window.innerHeight) {
        hero3d.style.transform = `translateY(${-scrolled * 0.3}px) rotate(${scrolled * 0.1}deg)`;
    }
});

// ============================================
// INITIALIZE ON LOAD
// ============================================

window.addEventListener('load', () => {
    const heroSection = document.querySelector('.hero-section');
    if (heroSection) {
        setTimeout(() => {
            heroSection.classList.add('visible');
        }, 100);
    }
});
