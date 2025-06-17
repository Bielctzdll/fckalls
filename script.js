document.addEventListener('DOMContentLoaded', () => {
    // Detecta se é um dispositivo móvel
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Profile Image Modal
    const profileImage = document.querySelector('.profile-image');
    const profileModal = document.querySelector('.profile-modal');
    const closeModal = document.querySelector('.close-modal');

    profileImage.addEventListener('click', () => {
        profileModal.classList.remove('hidden');
        setTimeout(() => {
            profileModal.classList.add('visible');
        }, 10);
    });

    closeModal.addEventListener('click', () => {
        profileModal.classList.remove('visible');
        setTimeout(() => {
            profileModal.classList.add('hidden');
        }, 300);
    });

    // Close modal when clicking outside
    profileModal.addEventListener('click', (e) => {
        if (e.target === profileModal) {
            profileModal.classList.remove('visible');
            setTimeout(() => {
                profileModal.classList.add('hidden');
            }, 300);
        }
    });

    // Tools Section
    const toolsLink = document.querySelector('.tools-link');
    const toolsSection = document.querySelector('.tools-section');
    const closeTools = document.querySelector('.close-tools');
    const themeButtons = document.querySelectorAll('.theme-btn');
    const animationToggle = document.querySelector('.animation-toggle input');

    toolsLink.addEventListener('click', (e) => {
        e.preventDefault();
        toolsSection.classList.remove('hidden');
        setTimeout(() => {
            toolsSection.classList.add('visible');
        }, 10);
    });

    closeTools.addEventListener('click', () => {
        toolsSection.classList.remove('visible');
        setTimeout(() => {
            toolsSection.classList.add('hidden');
        }, 300);
    });

    // Close tools when clicking outside
    toolsSection.addEventListener('click', (e) => {
        if (e.target === toolsSection) {
            toolsSection.classList.remove('visible');
            setTimeout(() => {
                toolsSection.classList.add('hidden');
            }, 300);
        }
    });

    // Theme buttons
    themeButtons.forEach(button => {
        const eventType = isMobile ? 'touchend' : 'click';
        button.addEventListener(eventType, () => {
            themeButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            applyTheme(button.dataset.theme);
        });
    });

    // Volume control
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    const bgMusic = document.getElementById('bgMusic');

    volumeSlider.addEventListener('input', () => {
        const value = volumeSlider.value;
        volumeValue.textContent = `${value}%`;
        bgMusic.volume = value / 100;
    });

    // Effect toggles
    const animationsToggle = document.getElementById('animationsToggle');
    const blurToggle = document.getElementById('blurToggle');
    const musicToggle = document.getElementById('musicToggle');

    animationsToggle.addEventListener('change', () => {
        document.body.classList.toggle('no-animations', !animationsToggle.checked);
    });

    blurToggle.addEventListener('change', () => {
        document.body.classList.toggle('no-blur', !blurToggle.checked);
    });

    musicToggle.addEventListener('change', () => {
        if (musicToggle.checked) {
            bgMusic.play();
        } else {
            bgMusic.pause();
        }
    });

    // Theme application function
    function applyTheme(theme) {
        document.body.className = `theme-${theme}`;
        
        const themes = {
            dark: {
                primary: '#1a1a1a',
                secondary: '#2a2a2a',
                text: '#fff'
            },
            darker: {
                primary: '#000000',
                secondary: '#1a1a1a',
                text: '#888'
            },
            neon: {
                primary: '#0a0a2a',
                secondary: '#1a1a4a',
                text: '#00ff88'
            },
            matrix: {
                primary: '#001100',
                secondary: '#002200',
                text: '#00ff00'
            }
        };

        const root = document.documentElement;
        const colors = themes[theme];
        
        root.style.setProperty('--primary-bg', colors.primary);
        root.style.setProperty('--secondary-bg', colors.secondary);
        root.style.setProperty('--text-color', colors.text);
    }

    const loadingScreen = document.querySelector('.loading-screen');
    const mainContent = document.querySelector('.main-content');

    // Elementos das notificações
    const mainNotification = document.querySelector('.main-notification');
    const versionNotification = document.getElementById('version-notification');
    const downloadsNotification = document.getElementById('downloads-notification');

    // Handle click/touch anywhere to enter
    const startEvent = isMobile ? 'touchend' : 'click';
    loadingScreen.addEventListener(startEvent, (e) => {
        if (isMobile) e.preventDefault();
        
        // Fade out loading screen with smooth transition
        loadingScreen.style.opacity = '0';
        
        // Show and animate main content
        mainContent.classList.remove('hidden');
        mainContent.style.opacity = '0';
        mainContent.style.transform = 'scale(0.98)';
        
        setTimeout(() => {
            mainContent.classList.add('visible');
            mainContent.style.opacity = '1';
            mainContent.style.transform = 'scale(1)';
            
            // Remove loading screen after transition
            setTimeout(() => {
                loadingScreen.style.display = 'none';

                // Mostra a notificação principal
                mainNotification.classList.add('visible');

                // Remove a notificação principal após 2 segundos
                setTimeout(() => {
                    mainNotification.classList.remove('visible');

                    // Mostra as notificações do canto em sequência
                    setTimeout(() => {
                        versionNotification.classList.add('visible');
                        
                        setTimeout(() => {
                            downloadsNotification.classList.add('visible');

                            // Remove as notificações do canto após 5 segundos
                            setTimeout(() => {
                                versionNotification.classList.remove('visible');
                                downloadsNotification.classList.remove('visible');
                            }, 5000);
                        }, 500);
                    }, 500);
                }, 2000);
            }, 300);
        }, 800);

        // Start playing music
        bgMusic.play().catch(() => {
            // Autoplay foi bloqueado, não faz nada
        });
    });

    // 3D card effect (apenas para desktop)
    const card = document.querySelector('.card');
    if (!isMobile) {
        document.addEventListener('mousemove', (e) => {
            const xAxis = (window.innerWidth / 2 - e.pageX) / 25;
            const yAxis = (window.innerHeight / 2 - e.pageY) / 25;
            card.style.transform = `rotateY(${xAxis}deg) rotateX(${yAxis}deg)`;
        });
    }

    // Handle Downloads Section
    const settingsLink = document.querySelector('.settings-link');
    const downloadsSection = document.querySelector('.downloads-section');
    const closeDownloads = document.querySelector('.close-downloads');
    const downloadButtons = document.querySelectorAll('.download-btn');

    settingsLink.addEventListener(startEvent, (e) => {
        e.preventDefault();
        downloadsSection.classList.remove('hidden');
        setTimeout(() => {
            downloadsSection.classList.add('visible');
        }, 10);
    });

    closeDownloads.addEventListener(startEvent, () => {
        downloadsSection.classList.remove('visible');
        setTimeout(() => {
            downloadsSection.classList.add('hidden');
        }, 300);
    });

    // Adicionar evento de download aos botões
    document.querySelectorAll('.download-btn').forEach(button => {
        if (button.tagName === 'A') {
            const originalHref = button.href;
            button.href = 'javascript:void(0)';
            
            button.addEventListener(startEvent, async (e) => {
                e.preventDefault();
                
                // Adiciona classe de loading
                button.classList.add('loading');
                
                // Simula um pequeno delay para mostrar o loading
                await new Promise(resolve => setTimeout(resolve, 1500));
                
                // Remove loading e mostra sucesso
                button.classList.remove('loading');
                button.classList.add('success');
                
                // Envia evento para o WebSocket
                ws.send(JSON.stringify({ type: 'download' }));
                
                // Após mostrar o sucesso, inicia o download
                setTimeout(() => {
                    window.location.href = originalHref;
                    
                    // Remove a classe de sucesso após 1 segundo
                    setTimeout(() => {
                        button.classList.remove('success');
                    }, 1000);
                }, 500);
            });
        }
    });

    // WebSocket Connection
    const ws = new WebSocket(`ws://${window.location.hostname}:3000`);

    ws.onmessage = (event) => {
        const stats = JSON.parse(event.data);
        document.getElementById('downloadCount').textContent = stats.downloads;
        document.getElementById('activeUsers').textContent = stats.activeUsers;
    };

    // Slider de Downloads (apenas para desktop)
    if (!isMobile) {
        let currentSlide = 0;
        const downloadGrid = document.querySelector('.downloads-grid');
        const cards = document.querySelectorAll('.download-card');
        const cardWidth = 320; // Largura do card + gap
        const cardsPerView = 3; // Número de cards visíveis por vez
        const maxSlide = Math.max(0, cards.length - cardsPerView);

        document.querySelector('.slider-nav.prev').addEventListener('click', () => {
            currentSlide = Math.max(currentSlide - 1, 0);
            updateSlider();
        });

        document.querySelector('.slider-nav.next').addEventListener('click', () => {
            currentSlide = Math.min(currentSlide + 1, maxSlide);
            updateSlider();
        });

        function updateSlider() {
            const offset = -currentSlide * cardWidth;
            downloadGrid.style.transform = `translateX(${offset}px)`;
            
            // Atualiza visibilidade das setas
            document.querySelector('.slider-nav.prev').style.opacity = currentSlide === 0 ? '0.5' : '1';
            document.querySelector('.slider-nav.next').style.opacity = currentSlide === maxSlide ? '0.5' : '1';
        }

        // Inicializa o slider
        updateSlider();
    }
}); 