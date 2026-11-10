/**
 * NASA Live Orrery Application Controller
 * Handles UI interactions and coordinates between components
 */

class NASALiveOrrery {
    constructor() {
        this.solarSystem = null;
        this.isInitialized = false;
        this.currentTab = 'planets';
        
        // UI elements
        this.sidePanel = null;
        this.loadingScreen = null;
        this.appContainer = null;
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Initializing NASA Live Orrery...');
            
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize UI elements
            this.initializeUI();
            console.log('✅ UI elements initialized');
            
            // Initialize solar system
            console.log('⏳ Creating Solar System...');
            this.solarSystem = new LiveSolarSystem();
            console.log('✅ Solar System created');
            
            // Preload asteroid data and WAIT for it to complete
            console.log('🔄 Preloading all 121 asteroid data...');
            await this.preloadAsteroidData();
            console.log('✅ All asteroid data loaded');
            
            // Hide asteroids after preloading (they're hidden by default now)
            if (this.solarSystem.asteroidsLoaded) {
                this.solarSystem.hideAsteroids();
                console.log('� Asteroids hidden - ready for user interaction');
            }
            
            // Load asteroid belt automatically
            console.log('🪨 Loading Main Asteroid Belt...');
            await this.solarSystem.loadAsteroidBelt(1000);
            console.log('✅ Asteroid belt loaded and visible');
            
            // Setup event listeners
            this.setupEventListeners();
            console.log('✅ Event listeners setup');
            
            // Start time display
            this.updateTimeDisplay();
            setInterval(() => this.updateTimeDisplay(), 1000);
            console.log('✅ Time display started');
            
            // Wait for loading animation to finish
            await this.simulateLoading();
            console.log('✅ Loading animation complete');
            
            // Hide loading screen and show app
            this.hideLoadingScreen();
            console.log('✅ Loading screen hidden');
            
            this.isInitialized = true;
            console.log('🎉 NASA Live Orrery initialized successfully!');
        } catch (error) {
            console.error('❌ ERROR during initialization:', error);
            console.error('Stack trace:', error.stack);
            alert('Failed to initialize the application. Check the console for details.');
        }
    }

    /**
     * Preload asteroid data in the background
     */
    async preloadAsteroidData() {
        try {
            const statusElement = document.getElementById('loading-status');
            
            if (!this.solarSystem.asteroidsLoaded) {
                if (statusElement) {
                    statusElement.innerHTML = '🔄 Initializing Near-Earth Asteroid data from NASA...';
                }
                console.log('⏳ Fetching Near-Earth Asteroids from NASA API...');
                
                // Define progress callback to update loading screen in real-time
                const progressCallback = (progress) => {
                    if (statusElement) {
                        const progressText = `Loading asteroid ${progress.current} of ${progress.total}...`;
                        const etaText = `Estimated time left: ${progress.estimatedTimeLeft} seconds`;
                        const asteroidNameText = `Fetching: ${progress.asteroidName}`;
                        
                        statusElement.innerHTML = `
                            <div style="font-size: 18px; margin-bottom: 10px;">🔄 ${progressText}</div>
                            <div style="font-size: 16px; color: #00ccff; margin-bottom: 8px;">⏱️ ${etaText}</div>
                            <div style="font-size: 14px; color: #aaaaaa;">${asteroidNameText}</div>
                        `;
                    }
                };
                
                await this.solarSystem.loadAsteroidData(progressCallback);
                
                if (statusElement) {
                    statusElement.innerHTML = '✅ All asteroids loaded! Preparing launch...';
                }
                console.log('✅ Asteroid data preloaded successfully! All asteroids ready.');
                
                // Small delay to show the success message
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        } catch (error) {
            console.warn('⚠️ Failed to preload asteroid data:', error);
            console.log('💡 Asteroids will load when Asteroids tab is clicked');
            
            const statusElement = document.getElementById('loading-status');
            if (statusElement) {
                statusElement.innerHTML = '⚠️ Asteroids will load on demand';
            }
        }
    }

    /**
     * Initialize UI elements
     */
    initializeUI() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.appContainer = document.getElementById('app-container');
        this.sidePanel = document.getElementById('side-panel');
    }

    /**
     * Simulate loading process
     */
    async simulateLoading() {
        return new Promise(resolve => {
            // Longer loading time to show asteroid loading animation
            setTimeout(resolve, 5000);
        });
    }

    /**
     * Show loading screen
     */
    showLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.remove('hidden');
        }
    }

    /**
     * Hide loading screen and show app
     */
    hideLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.classList.add('hidden');
        }
        if (this.appContainer) {
            this.appContainer.style.display = 'block';
        }
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Menu toggle
        const menuToggle = document.getElementById('menu-toggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => this.toggleSidePanel());
        }

        // Close panel button
        const closePanel = document.getElementById('close-panel');
        if (closePanel) {
            closePanel.addEventListener('click', () => this.closeSidePanel());
        }

        // Tab navigation
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Planet selection
        const planetItems = document.querySelectorAll('.planet-item');
        planetItems.forEach(item => {
            item.addEventListener('click', (e) => {
                const planetKey = e.currentTarget.dataset.planet;
                this.selectPlanet(planetKey);
            });
        });

        // Control buttons
        this.setupControlListeners();

        // View controls
        this.setupViewControls();
    }

    /**
     * Setup control button listeners
     */
    setupControlListeners() {
        // NASA Eyes Style Bottom Time Controls
        const timePlayPauseBtn = document.getElementById('time-play-pause-btn');
        if (timePlayPauseBtn) {
            timePlayPauseBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.toggleAnimation();
                    const isPlaying = this.solarSystem.isPlaying;
                    timePlayPauseBtn.querySelector('span').textContent = isPlaying ? '⏸' : '▶';
                }
            });
        }
        
        const timeNowBtn = document.getElementById('time-now-btn');
        if (timeNowBtn) {
            timeNowBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToCurrentTime();
                    this.updateSpeedDisplay();
                }
            });
        }
        
        const timeBackwardBtn = document.getElementById('time-backward-btn');
        if (timeBackwardBtn) {
            timeBackwardBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToPreviousDay();
                }
            });
        }
        
        const timeForwardBtn = document.getElementById('time-forward-btn');
        if (timeForwardBtn) {
            timeForwardBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToNextDay();
                }
            });
        }
        
        // Speed controls
        const speedSlowerBtn = document.getElementById('speed-slower-btn');
        if (speedSlowerBtn) {
            speedSlowerBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.adjustTimeSpeed(-1);
                }
            });
        }
        
        const speedFasterBtn = document.getElementById('speed-faster-btn');
        if (speedFasterBtn) {
            speedFasterBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.adjustTimeSpeed(1);
                }
            });
        }
        
        // Time navigation buttons (sidebar - keep for compatibility)
        const currentTimeBtn = document.getElementById('current-time-btn');
        if (currentTimeBtn) {
            currentTimeBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToCurrentTime();
                    this.updateSpeedDisplay();
                }
            });
        }
        
        const prevDayBtn = document.getElementById('prev-day-btn');
        if (prevDayBtn) {
            prevDayBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToPreviousDay();
                }
            });
        }
        
        const nextDayBtn = document.getElementById('next-day-btn');
        if (nextDayBtn) {
            nextDayBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToNextDay();
                }
            });
        }
        
        const prevMonthBtn = document.getElementById('prev-month-btn');
        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToPreviousMonth();
                }
            });
        }
        
        const nextMonthBtn = document.getElementById('next-month-btn');
        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToNextMonth();
                }
            });
        }
        
        const prevYearBtn = document.getElementById('prev-year-btn');
        if (prevYearBtn) {
            prevYearBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToPreviousYear();
                }
            });
        }
        
        const nextYearBtn = document.getElementById('next-year-btn');
        if (nextYearBtn) {
            nextYearBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.jumpToNextYear();
                }
            });
        }
        
        // Speed control buttons
        const speedButtons = [
            { id: 'speed-realtime-btn', multiplier: 1 },
            { id: 'speed-1day-btn', multiplier: 86400 },
            { id: 'speed-7day-btn', multiplier: 604800 },
            { id: 'speed-30day-btn', multiplier: 2592000 }
        ];
        
        speedButtons.forEach(({ id, multiplier }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    if (this.solarSystem) {
                        this.solarSystem.setTimeMultiplier(multiplier);
                        this.updateSpeedDisplay();
                        // Update active button
                        speedButtons.forEach(({ id: btnId }) => {
                            const otherBtn = document.getElementById(btnId);
                            if (otherBtn) {
                                otherBtn.classList.toggle('active', btnId === id);
                            }
                        });
                    }
                });
            }
        });

        // Zoom control
        const zoomSlider = document.getElementById('zoom-level');
        const zoomValue = document.getElementById('zoom-level-value');
        if (zoomSlider && zoomValue) {
            zoomSlider.addEventListener('input', (e) => {
                const zoom = parseFloat(e.target.value);
                zoomValue.textContent = `${zoom}x`;
                // Implement zoom functionality
            });
        }

        // Play/Pause button (sidebar)
        const playPauseBtn = document.getElementById('play-pause-btn');
        if (playPauseBtn) {
            playPauseBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.toggleAnimation();
                    const isPlaying = this.solarSystem.isPlaying;
                    playPauseBtn.textContent = isPlaying ? '⏸️ Pause' : '▶️ Play';
                    // Update bottom control as well
                    if (timePlayPauseBtn) {
                        timePlayPauseBtn.querySelector('span').textContent = isPlaying ? '⏸' : '▶';
                    }
                }
            });
        }

        // Reset view button
        const resetViewBtn = document.getElementById('reset-view-btn');
        if (resetViewBtn) {
            resetViewBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.resetView();
                }
            });
        }

        // Toggle buttons
        this.setupToggleButton('toggle-orbits-btn', () => {
            if (this.solarSystem) {
                this.solarSystem.toggleOrbits();
            }
        });

        this.setupToggleButton('toggle-labels-btn', () => {
            if (this.solarSystem) {
                this.solarSystem.toggleLabels();
            }
        });

        // Follow Earth button
        this.setupToggleButton('follow-earth-btn', () => {
            if (this.solarSystem) {
                const currentState = this.solarSystem.followEarth;
                this.solarSystem.setFollowEarth(!currentState);
            }
        });
        
        // Setup simple toggle filters for asteroids
        this.setupAsteroidToggleFilters();
        
        // Apply filters when asteroids load
        window.addEventListener('asteroids-loaded', () => {
            console.log('🎯 Asteroids loaded, applying toggle filters...');
            this.applyAsteroidToggleFilters();
        });
    }
    
    /**
     * Setup simple toggle filters for asteroids
     */
    setupAsteroidToggleFilters() {
        const toggleButtons = [
            { id: 'toggle-red', colors: ['EXTREME', 'HIGH'] },
            { id: 'toggle-yellow', colors: ['MODERATE'] },
            { id: 'toggle-green', colors: ['SAFE'] }
        ];
        
        toggleButtons.forEach(({ id, colors }) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.addEventListener('click', () => {
                    btn.classList.toggle('active');
                    // Update button appearance
                    if (btn.classList.contains('active')) {
                        btn.style.opacity = '1';
                        btn.style.borderWidth = '2px';
                    } else {
                        btn.style.opacity = '0.3';
                        btn.style.borderWidth = '2px';
                        btn.style.borderStyle = 'dashed';
                    }
                    this.applyAsteroidToggleFilters();
                });
            }
        });
    }
    
    /**
     * Apply toggle filters to asteroids and orbits
     */
    applyAsteroidToggleFilters() {
        if (!this.solarSystem || !this.solarSystem.asteroids) return;
        
        // Get active color filters
        const showRed = document.getElementById('toggle-red')?.classList.contains('active') || false;
        const showYellow = document.getElementById('toggle-yellow')?.classList.contains('active') || false;
        const showGreen = document.getElementById('toggle-green')?.classList.contains('active') || false;
        
        console.log(`🎯 Toggle Filters: RED=${showRed}, YELLOW=${showYellow}, GREEN=${showGreen}`);
        
        let visibleCount = 0;
        let hiddenCount = 0;
        
        // Filter both 3D scene and prepare list data
        const visibleAsteroids = [];
        
        Object.values(this.solarSystem.asteroids).forEach(asteroid => {
            const dangerLevel = asteroid.userData.dangerLevel;
            
            // Determine visibility based on danger level and toggles
            let visible = false;
            if ((dangerLevel === 'EXTREME' || dangerLevel === 'HIGH') && showRed) {
                visible = true;
            } else if (dangerLevel === 'MODERATE' && showYellow) {
                visible = true;
            } else if (dangerLevel === 'SAFE' && showGreen) {
                visible = true;
            }
            
            // Apply visibility to asteroid
            asteroid.visible = visible;
            
            // Apply visibility to orbit
            const orbitId = asteroid.userData.nasaData.id;
            if (this.solarSystem.orbits[orbitId]) {
                const orbit = this.solarSystem.orbits[orbitId];
                orbit.visible = visible;
                
                // Restore normal color to prevent red bug
                if (visible && !orbit.userData.isHighlighted) {
                    orbit.material.color.setHex(orbit.userData.normalColor);
                    orbit.material.opacity = orbit.userData.normalOpacity;
                    orbit.material.needsUpdate = true;
                }
            }
            
            if (visible) {
                visibleCount++;
                visibleAsteroids.push(asteroid.userData.nasaData);
            } else {
                hiddenCount++;
            }
        });
        
        // Update the list to show only visible asteroids
        if (this.solarSystem.loadedAsteroidData) {
            const filteredData = this.solarSystem.loadedAsteroidData.filter(asteroid => {
                const missDistance = asteroid.miss_distance_km || asteroid.close_approach_data?.[0]?.miss_distance?.kilometers || Infinity;
                const isVeryClose = missDistance < 1000000;
                const isClose = missDistance < 7480000;
                const isModerate = missDistance < 30000000;
                const isPotentiallyHazardous = asteroid.is_potentially_hazardous;
                
                let dangerLevel;
                if (isPotentiallyHazardous && isVeryClose) {
                    dangerLevel = 'EXTREME';
                } else if (isPotentiallyHazardous || isClose) {
                    dangerLevel = 'HIGH';
                } else if (isModerate) {
                    dangerLevel = 'MODERATE';
                } else {
                    dangerLevel = 'SAFE';
                }
                
                if ((dangerLevel === 'EXTREME' || dangerLevel === 'HIGH') && showRed) return true;
                if (dangerLevel === 'MODERATE' && showYellow) return true;
                if (dangerLevel === 'SAFE' && showGreen) return true;
                return false;
            });
            
            this.solarSystem.updateAsteroidUI(filteredData);
        }
        
        console.log(`✅ Filtered: ${visibleCount} visible, ${hiddenCount} hidden`);
    }

    /**
     * Adjust time speed incrementally
     */
    adjustTimeSpeed(direction) {
        const speedLevels = [1, 3600, 86400, 604800, 2592000]; // real-time, hour, day, week, month per second
        let currentIndex = speedLevels.indexOf(this.solarSystem.timeMultiplier);
        
        if (currentIndex === -1) {
            // Find closest
            currentIndex = speedLevels.findIndex(s => s >= this.solarSystem.timeMultiplier);
            if (currentIndex === -1) currentIndex = speedLevels.length - 1;
        }
        
        const newIndex = Math.max(0, Math.min(speedLevels.length - 1, currentIndex + direction));
        this.solarSystem.setTimeMultiplier(speedLevels[newIndex]);
        this.updateSpeedDisplay();
    }
    
    /**
     * Update speed display
     */
    updateSpeedDisplay() {
        const speedDisplay = document.getElementById('speed-display');
        if (!speedDisplay || !this.solarSystem) return;
        
        const multiplier = this.solarSystem.timeMultiplier;
        const isRealTime = this.solarSystem.realTimeMode;
        
        let displayText = '';
        if (isRealTime || multiplier === 1) {
            displayText = 'Real-time';
        } else if (multiplier === 3600) {
            displayText = '1 hr/sec';
        } else if (multiplier === 86400) {
            displayText = '1 day/sec';
        } else if (multiplier === 604800) {
            displayText = '1 week/sec';
        } else if (multiplier === 2592000) {
            displayText = '1 month/sec';
        } else if (multiplier < 60) {
            displayText = `${multiplier}x`;
        } else if (multiplier < 3600) {
            displayText = `${Math.round(multiplier/60)} min/sec`;
        } else {
            displayText = `${Math.round(multiplier/86400)} days/sec`;
        }
        
        speedDisplay.textContent = displayText;
    }

    /**
     * Setup view controls (HUD buttons)
     */
    setupViewControls() {
        const zoomInBtn = document.getElementById('zoom-in-btn');
        const zoomOutBtn = document.getElementById('zoom-out-btn');
        const homeBtn = document.getElementById('home-btn');

        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                // Implement zoom in
                console.log('Zoom in');
            });
        }

        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                // Implement zoom out
                console.log('Zoom out');
            });
        }

        if (homeBtn) {
            homeBtn.addEventListener('click', () => {
                if (this.solarSystem) {
                    this.solarSystem.resetView();
                }
            });
        }
    }

    /**
     * Setup asteroid filter checkboxes
     */
    setupAsteroidFilters() {
        const showAllAsteroids = document.getElementById('show-all-asteroids');
        const showHazardous = document.getElementById('show-hazardous');
        const showCloseApproach = document.getElementById('show-close-approach');

        if (showAllAsteroids) {
            showAllAsteroids.addEventListener('change', () => {
                this.updateAsteroidFilters();
            });
        }

        if (showHazardous) {
            showHazardous.addEventListener('change', () => {
                this.updateAsteroidFilters();
            });
        }

        if (showCloseApproach) {
            showCloseApproach.addEventListener('change', () => {
                this.updateAsteroidFilters();
            });
        }
    }

    /**
     * Setup toggle button functionality
     */
    setupToggleButton(buttonId, callback) {
        const button = document.getElementById(buttonId);
        if (button) {
            button.addEventListener('click', () => {
                button.classList.toggle('active');
                if (callback) callback();
            });
        }
    }

    /**
     * Toggle side panel
     */
    toggleSidePanel() {
        if (this.sidePanel) {
            this.sidePanel.classList.toggle('open');
        }
    }

    /**
     * Close side panel and hide asteroid orbitals/meteor showers if visible
     */
    closeSidePanel() {
        if (this.sidePanel) {
            this.sidePanel.classList.remove('open');
        }
        
        // Hide asteroids and their orbitals when closing the panel
        if (this.currentTab === 'asteroids' && this.solarSystem) {
            console.log('🔴 Closing panel - hiding asteroid orbitals');
            this.solarSystem.hideAsteroids();
        }
        
        // Hide meteor showers when closing the panel
        if (this.currentTab === 'meteorshowers' && this.meteorShowerService) {
            console.log('🌌 Closing panel - hiding meteor shower visualizations');
            this.meteorShowerService.hideAllMeteorVisualizations();
        }
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        // Update button states
        const tabButtons = document.querySelectorAll('.tab-btn');
        tabButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tab === tabName) {
                btn.classList.add('active');
            }
        });

        // Update content visibility
        const tabContents = document.querySelectorAll('.tab-content');
        tabContents.forEach(content => {
            content.classList.remove('active');
        });

        const activeTab = document.getElementById(`${tabName}-tab`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        this.currentTab = tabName;
        
        // Clean up: Hide asteroids when switching away from Asteroids tab
        if (tabName !== 'asteroids' && this.solarSystem) {
            this.solarSystem.hideAsteroids();
        }
        
        // Clean up: Hide meteor showers when switching away from Meteor Showers tab
        if (tabName !== 'meteorshowers' && this.meteorShowerService) {
            this.meteorShowerService.hideAllMeteorVisualizations();
        }
        
        // Load and show asteroids when Asteroids tab is clicked
        if (tabName === 'asteroids' && this.solarSystem) {
            console.log('🔴 Showing Near-Earth Objects with orbits...');
            this.solarSystem.showAsteroids();
        }
        
        // Load meteor showers when Meteor Showers tab is clicked
        if (tabName === 'meteorshowers') {
            console.log('🌌 Loading Meteor Showers...');
            if (!this.meteorShowerService) {
                this.meteorShowerService = new MeteorShowerService(
                    this.solarSystem.nasaAPI,
                    this.solarSystem.scene
                );
            }
            this.meteorShowerService.loadMeteorShowerUI();
        }
    }

    /**
     * Select a planet
     */
    selectPlanet(planetKey) {
        // Update UI selection
        const planetItems = document.querySelectorAll('.planet-item');
        planetItems.forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.planet === planetKey) {
                item.classList.add('selected');
            }
        });

        // Focus on planet in 3D view
        if (this.solarSystem && this.solarSystem.planets[planetKey]) {
            const planet = this.solarSystem.planets[planetKey];
            this.solarSystem.focusOnObject(planet);
            this.solarSystem.updateSelectedObjectInfo(planet.userData.info);
        } else if (planetKey === 'sun' && this.solarSystem) {
            this.solarSystem.focusOnObject(this.solarSystem.sun);
            this.solarSystem.updateSelectedObjectInfo(this.solarSystem.sun.userData.info);
        }
    }

    /**
     * Update time display
     */
    updateTimeDisplay() {
        const now = new Date();
        
        const dateElement = document.getElementById('current-date');
        const timeElement = document.getElementById('current-time');
        
        if (dateElement) {
            dateElement.textContent = now.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        if (timeElement) {
            timeElement.textContent = now.toLocaleTimeString('en-US', {
                hour12: false,
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'
            }) + ' UTC';
        }
        
        // Update simulation date display (sidebar)
        if (this.solarSystem) {
            const simDate = this.solarSystem.getSimulationDate();
            const isRealTime = this.solarSystem.realTimeMode;
            const simDateElement = document.getElementById('simulation-date');
            if (simDateElement) {
                const liveIndicator = isRealTime ? 
                    '<div style="display: inline-block; width: 8px; height: 8px; background: #00ff00; border-radius: 50%; animation: pulse 1.5s infinite; margin-right: 6px;"></div><span style="color: #00ff00; font-weight: bold;">🔴 LIVE</span>' : 
                    '<span style="color: #ffaa00;">⏩ TIME TRAVEL</span>';
                    
                simDateElement.innerHTML = `
                    <div style="margin-bottom: 8px;">${liveIndicator}</div>
                    <div style="font-size: 16px; font-weight: bold;">${simDate.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                    })}</div>
                    <div style="font-size: 12px; color: #00ccff; margin-top: 4px;">${simDate.toLocaleTimeString('en-US', {
                        hour12: false,
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    })} UTC</div>
                `;
            }
            
            // Update bottom time controls display
            const dateLine = document.getElementById('date-line');
            const timeLine = document.getElementById('time-line');
            
            if (dateLine) {
                dateLine.textContent = simDate.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                });
            }
            
            if (timeLine) {
                timeLine.textContent = simDate.toLocaleTimeString('en-US', {
                    hour12: false,
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }) + ' UTC';
            }
            
            // Update speed display
            this.updateSpeedDisplay();
        }
    }

    /**
     * Update asteroid filters
     */
    updateAsteroidFilters() {
        // Get filter states
        const showAll = document.getElementById('show-all-asteroids')?.checked || false;
        const showHazardous = document.getElementById('show-hazardous')?.checked || false;
        const showCloseApproach = document.getElementById('show-close-approach')?.checked || false;

        // Apply filters to asteroid display
        const asteroidItems = document.querySelectorAll('.asteroid-item');
        asteroidItems.forEach(item => {
            let show = showAll;
            
            if (showHazardous && item.classList.contains('hazardous')) {
                show = true;
            }
            
            if (showCloseApproach && item.classList.contains('close-approach')) {
                show = true;
            }
            
            item.style.display = show ? 'block' : 'none';
        });
        
        console.log(`Applied asteroid filters: all=${showAll}, hazardous=${showHazardous}, closeApproach=${showCloseApproach}`);
    }

    /**
     * Handle keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'Space':
                    event.preventDefault();
                    if (this.solarSystem) {
                        this.solarSystem.toggleAnimation();
                    }
                    break;
                case 'KeyR':
                    if (this.solarSystem) {
                        this.solarSystem.resetView();
                    }
                    break;
                case 'KeyM':
                    this.toggleSidePanel();
                    break;
                case 'Escape':
                    this.closeSidePanel();
                    break;
            }
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.nasaOrrery = new NASALiveOrrery();
});

// Handle page visibility change to pause/resume animation
document.addEventListener('visibilitychange', () => {
    if (window.nasaOrrery && window.nasaOrrery.solarSystem) {
        if (document.hidden) {
            // Pause when page is not visible
            window.nasaOrrery.solarSystem.isPlaying = false;
        } else {
            // Resume when page becomes visible
            window.nasaOrrery.solarSystem.isPlaying = true;
        }
    }
});

// Export for global access
window.NASALiveOrrery = NASALiveOrrery;