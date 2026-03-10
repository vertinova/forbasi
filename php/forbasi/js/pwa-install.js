/**
 * PWA Install Prompt UI
 * Beautiful full-screen install prompt for desktop and mobile
 */

(function() {
    'use strict';

    let deferredPrompt;
    let installButton;
    let installPromptShown = false;

    // Check if app is already installed
    function isAppInstalled() {
        // Check if running as standalone
        if (window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true) {
            return true;
        }
        return localStorage.getItem('pwa-installed') === 'true';
    }

    // Check if user dismissed the prompt
    function isPromptDismissed() {
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        if (!dismissed) return false;
        
        const dismissedTime = new Date(dismissed).getTime();
        const now = new Date().getTime();
        const daysSinceDismissal = (now - dismissedTime) / (1000 * 60 * 60 * 24);
        
        // Show again after 7 days
        return daysSinceDismissal < 7;
    }

    // Create install prompt UI
    function createInstallPrompt() {
        // Detect base path
        const basePath = window.location.pathname.includes('/forbasi/') ? '/forbasi/' : '/';
        
        const promptHTML = `
            <div id="pwa-install-prompt" class="pwa-install-overlay">
                <div class="pwa-install-modal">
                    <button class="pwa-close-btn" id="pwa-close-btn" aria-label="Tutup">
                        <i class="fas fa-times"></i>
                    </button>
                    
                    <div class="pwa-content">
                        <div class="pwa-icon-container">
                            <img src="${basePath}forbasi/assets/LOGO-FORBASI.png" alt="FORBASI Logo" class="pwa-app-icon">
                            <div class="pwa-icon-badge">
                                <i class="fas fa-mobile-alt"></i>
                            </div>
                        </div>
                        
                        <h2 class="pwa-title">Install FORBASI</h2>
                        <p class="pwa-subtitle">Gunakan seperti aplikasi native di perangkat Anda</p>
                        
                        <div class="pwa-buttons">
                            <button class="pwa-btn pwa-btn-primary" id="pwa-install-btn">
                                <i class="fas fa-download"></i>
                                <span>Install Sekarang</span>
                            </button>
                            <button class="pwa-btn pwa-btn-secondary" id="pwa-later-btn">
                                Nanti Saja
                            </button>
                        </div>
                        
                        <p class="pwa-privacy">
                            <i class="fas fa-shield-alt"></i>
                            Aplikasi ini aman dan tidak akan mengambil ruang penyimpanan yang besar
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            .pwa-install-overlay {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                z-index: 999999;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                animation: pwaFadeIn 0.3s ease-out;
            }

            @keyframes pwaFadeIn {
                from {
                    opacity: 0;
                }
                to {
                    opacity: 1;
                }
            }

            @keyframes pwaSlideUp {
                from {
                    transform: translateY(50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            .pwa-install-modal {
                background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
                border-radius: 24px;
                max-width: 500px;
                width: 100%;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
                position: relative;
                animation: pwaSlideUp 0.4s ease-out;
            }

            .pwa-close-btn {
                position: absolute;
                top: 15px;
                right: 15px;
                background: rgba(0, 0, 0, 0.1);
                border: none;
                width: 36px;
                height: 36px;
                border-radius: 50%;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                z-index: 10;
            }

            .pwa-close-btn:hover {
                background: rgba(0, 0, 0, 0.2);
                transform: rotate(90deg);
            }

            .pwa-close-btn i {
                color: #666;
                font-size: 18px;
            }

            .pwa-content {
                padding: 40px 30px 30px;
                text-align: center;
            }

            .pwa-icon-container {
                position: relative;
                width: 120px;
                height: 120px;
                margin: 0 auto 25px;
            }

            .pwa-app-icon {
                width: 120px;
                height: 120px;
                border-radius: 24px;
                box-shadow: 0 10px 30px rgba(13, 149, 0, 0.3);
                object-fit: contain;
                background: white;
                padding: 10px;
            }

            .pwa-icon-badge {
                position: absolute;
                bottom: -5px;
                right: -5px;
                background: linear-gradient(135deg, #0d9500 0%, #0a7000 100%);
                color: white;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 12px rgba(13, 149, 0, 0.4);
                border: 3px solid white;
            }

            .pwa-icon-badge i {
                font-size: 16px;
            }

            .pwa-title {
                font-size: 28px;
                font-weight: 700;
                color: #0d9500;
                margin: 0 0 10px;
                font-family: 'Poppins', sans-serif;
            }

            .pwa-subtitle {
                font-size: 16px;
                color: #666;
                margin: 0 0 30px;
                line-height: 1.5;
            }

            .pwa-features {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 15px;
                margin-bottom: 25px;
            }

            .pwa-device-info {
                background: #e3f2fd;
                border-left: 4px solid #2196f3;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 25px;
            }

            .pwa-device-info p {
                margin: 0;
                font-size: 14px;
                color: #1976d2;
                line-height: 1.6;
            }

            .pwa-buttons {
                display: flex;
                flex-direction: column;
                gap: 12px;
                margin-bottom: 20px;
            }

            .pwa-btn {
                padding: 16px 32px;
                border: none;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
                font-family: 'Poppins', sans-serif;
            }

            .pwa-btn-primary {
                background: linear-gradient(135deg, #0d9500 0%, #0a7000 100%);
                color: white;
                box-shadow: 0 4px 15px rgba(13, 149, 0, 0.3);
            }

            .pwa-btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(13, 149, 0, 0.4);
            }

            .pwa-btn-primary:active {
                transform: translateY(0);
            }

            .pwa-btn-secondary {
                background: transparent;
                color: #666;
                border: 2px solid #ddd;
            }

            .pwa-btn-secondary:hover {
                background: #f5f5f5;
                border-color: #ccc;
            }

            .pwa-privacy {
                font-size: 12px;
                color: #999;
                margin: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }

            .pwa-privacy i {
                color: #4caf50;
            }

            /* Mobile responsive */
            @media (max-width: 480px) {
                .pwa-install-modal {
                    border-radius: 20px 20px 0 0;
                    margin-top: auto;
                    max-height: 85vh;
                }

                .pwa-content {
                    padding: 30px 20px 20px;
                }

                .pwa-title {
                    font-size: 24px;
                }

                .pwa-features {
                    grid-template-columns: repeat(2, 1fr);
                    gap: 10px;
                }

                .pwa-feature {
                    padding: 12px;
                }

                .pwa-feature i {
                    font-size: 20px;
                }

                .pwa-feature span {
                    font-size: 12px;
                }
            }

            /* Landscape tablets */
            @media (min-width: 768px) and (max-width: 1024px) and (orientation: landscape) {
                .pwa-install-modal {
                    max-height: 80vh;
                }

                .pwa-content {
                    padding: 30px 25px;
                }
            }
        `;

        document.head.appendChild(style);
        document.body.insertAdjacentHTML('beforeend', promptHTML);

        // Add event listeners
        document.getElementById('pwa-install-btn').addEventListener('click', handleInstall);
        document.getElementById('pwa-later-btn').addEventListener('click', dismissPrompt);
        document.getElementById('pwa-close-btn').addEventListener('click', dismissPrompt);
        
        // Close on overlay click
        document.getElementById('pwa-install-prompt').addEventListener('click', (e) => {
            if (e.target.id === 'pwa-install-prompt') {
                dismissPrompt();
            }
        });
    }

    // Handle install
    async function handleInstall() {
        if (!deferredPrompt) {
            // Show manual install instructions for iOS/other browsers
            showManualInstallInstructions();
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond
        const choiceResult = await deferredPrompt.userChoice;
        
        if (choiceResult.outcome === 'accepted') {
            console.log('[PWA] User accepted the install prompt');
            localStorage.setItem('pwa-installed', 'true');
            removePrompt();
        } else {
            console.log('[PWA] User dismissed the install prompt');
            dismissPrompt();
        }
        
        deferredPrompt = null;
    }

    // Show manual install instructions
    function showManualInstallInstructions() {
        // Create instruction overlay
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        
        let instructions = '';
        
        if (isIOS) {
            instructions = `
                <div style="background: #fff3e0; border-left: 4px solid #ff9800; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p style="margin: 0 0 15px 0; font-weight: 600; color: #e65100;">📱 Cara Install di iOS:</p>
                    <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                        <li>Tap tombol <strong>Share</strong> <i class="fas fa-share" style="color: #007aff;"></i> di bawah</li>
                        <li>Scroll ke bawah dan pilih <strong>"Add to Home Screen"</strong></li>
                        <li>Tap <strong>"Add"</strong> untuk konfirmasi</li>
                    </ol>
                </div>
            `;
        } else {
            instructions = `
                <div style="background: #e3f2fd; border-left: 4px solid #2196f3; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: left;">
                    <p style="margin: 0 0 15px 0; font-weight: 600; color: #1565c0;">📱 Cara Install:</p>
                    <ol style="margin: 0; padding-left: 20px; font-size: 14px; line-height: 1.8;">
                        <li>Buka menu browser <strong>(⋮)</strong></li>
                        <li>Pilih <strong>"Install app"</strong> atau <strong>"Add to Home screen"</strong></li>
                        <li>Ikuti instruksi yang muncul</li>
                    </ol>
                </div>
            `;
        }
        
        // Update modal content
        const modal = document.querySelector('.pwa-content');
        const title = modal.querySelector('.pwa-title');
        const subtitle = modal.querySelector('.pwa-subtitle');
        const buttons = modal.querySelector('.pwa-buttons');
        
        // Insert instructions before buttons
        buttons.insertAdjacentHTML('beforebegin', instructions);
        
        // Hide install button, only show close
        const installBtn = document.getElementById('pwa-install-btn');
        installBtn.style.display = 'none';
        
        const laterBtn = document.getElementById('pwa-later-btn');
        laterBtn.textContent = 'Tutup';
        laterBtn.style.width = '100%';
    }

    // Dismiss prompt
    function dismissPrompt() {
        localStorage.setItem('pwa-prompt-dismissed', new Date().toISOString());
        removePrompt();
    }

    // Remove prompt from DOM
    function removePrompt() {
        const prompt = document.getElementById('pwa-install-prompt');
        if (prompt) {
            prompt.style.animation = 'pwaFadeOut 0.3s ease-out';
            setTimeout(() => prompt.remove(), 300);
        }
    }

    // Show prompt if conditions are met
    function showPromptIfNeeded() {
        if (installPromptShown) return;
        if (isAppInstalled()) {
            console.log('[PWA] App already installed');
            return;
        }
        if (isPromptDismissed()) {
            console.log('[PWA] Prompt was dismissed recently');
            return;
        }

        console.log('[PWA] Showing install prompt...');
        // Show after short delay for better UX
        setTimeout(() => {
            createInstallPrompt();
            installPromptShown = true;
        }, 2000); // Show after 2 seconds
    }

    // Listen for beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        console.log('[PWA] Install prompt available from browser - deferredPrompt saved!');
        // Show our custom prompt immediately after we have deferredPrompt
        setTimeout(() => {
            showPromptIfNeeded();
        }, 2000);
    });

    // Detect if app was installed
    window.addEventListener('appinstalled', () => {
        console.log('[PWA] App was installed');
        localStorage.setItem('pwa-installed', 'true');
        deferredPrompt = null;
        removePrompt();
    });

    // Add fadeOut animation
    const fadeOutStyle = document.createElement('style');
    fadeOutStyle.textContent = `
        @keyframes pwaFadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
    `;
    document.head.appendChild(fadeOutStyle);

    // Expose function globally for debugging
    window.PWA_DEBUG = {
        clearStorage: function() {
            localStorage.removeItem('pwa-prompt-dismissed');
            localStorage.removeItem('pwa-installed');
            console.log('[PWA DEBUG] Storage cleared. Reloading...');
            location.reload();
        },
        forceShow: function() {
            installPromptShown = false;
            localStorage.removeItem('pwa-prompt-dismissed');
            localStorage.removeItem('pwa-installed');
            console.log('[PWA DEBUG] Force showing prompt...');
            showPromptIfNeeded();
        },
        status: function() {
            console.log('[PWA DEBUG] Status:');
            console.log('- App Installed:', isAppInstalled());
            console.log('- Prompt Dismissed:', isPromptDismissed());
            console.log('- Prompt Shown:', installPromptShown);
            console.log('- Deferred Prompt:', !!deferredPrompt);
        }
    };

})();
