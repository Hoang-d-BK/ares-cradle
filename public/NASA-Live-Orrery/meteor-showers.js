/**
 * Meteor Shower Data and Visualization
 * Real astronomical data from IAU Meteor Data Center
 */

class MeteorShowerService {
    constructor(nasaAPI, scene) {
        this.nasaAPI = nasaAPI;
        this.scene = scene;
        this.meteorShowers = this.getMeteorShowerData();
        this.meteorGroups = {}; // Store meteor particle groups
        this.selectedShower = null;
    }

    /**
     * Get real meteor shower data with parent bodies
     */
    getMeteorShowerData() {
        return [
            {
                name: "Perseids",
                code: "PER",
                parentBody: "109P/Swift-Tuttle (Comet)",
                peakDate: "August 12-13",
                activity: "July 17 - August 24",
                zhr: 100, // Zenith Hourly Rate
                velocity: 59, // km/s
                radiant: "Perseus constellation",
                description: "One of the best meteor showers. Swift-Tuttle has a 133-year orbit.",
                color: "#ff6b35",
                // Orbital parameters (approximate for visualization)
                semiMajorAxis: 26.092, // AU
                eccentricity: 0.9632,
                inclination: 113.45, // degrees
                longitudeOfAscendingNode: 139.38,
                argumentOfPerihelion: 152.98
            },
            {
                name: "Geminids",
                code: "GEM",
                parentBody: "3200 Phaethon (Asteroid)",
                peakDate: "December 13-14",
                activity: "December 4 - 17",
                zhr: 150,
                velocity: 35,
                radiant: "Gemini constellation",
                description: "Most reliable shower. Phaethon is a rock comet with a 1.4-year orbit.",
                color: "#4fc3f7",
                semiMajorAxis: 1.271,
                eccentricity: 0.8899,
                inclination: 22.24,
                longitudeOfAscendingNode: 265.24,
                argumentOfPerihelion: 322.11
            },
            {
                name: "Quadrantids",
                code: "QUA",
                parentBody: "2003 EH1 (Asteroid)",
                peakDate: "January 3-4",
                activity: "December 28 - January 12",
                zhr: 120,
                velocity: 41,
                radiant: "Boötes constellation",
                description: "Sharp peak lasting only hours. Parent body 2003 EH1 orbits every 5.5 years.",
                color: "#81c784",
                semiMajorAxis: 3.124,
                eccentricity: 0.6189,
                inclination: 70.76,
                longitudeOfAscendingNode: 282.96,
                argumentOfPerihelion: 171.39
            },
            {
                name: "Lyrids",
                code: "LYR",
                parentBody: "C/1861 G1 Thatcher (Comet)",
                peakDate: "April 22-23",
                activity: "April 16 - 25",
                zhr: 18,
                velocity: 49,
                radiant: "Lyra constellation",
                description: "Ancient shower. Comet Thatcher has a 415-year orbit.",
                color: "#ffb74d",
                semiMajorAxis: 55.68,
                eccentricity: 0.9834,
                inclination: 79.77,
                longitudeOfAscendingNode: 213.45,
                argumentOfPerihelion: 214.9
            },
            {
                name: "Eta Aquariids",
                code: "ETA",
                parentBody: "1P/Halley (Comet)",
                peakDate: "May 6-7",
                activity: "April 19 - May 28",
                zhr: 50,
                velocity: 66,
                radiant: "Aquarius constellation",
                description: "From Halley's Comet. Best in Southern Hemisphere. Halley orbits every 76 years.",
                color: "#9575cd",
                semiMajorAxis: 17.834,
                eccentricity: 0.9671,
                inclination: 162.26,
                longitudeOfAscendingNode: 58.42,
                argumentOfPerihelion: 111.33
            },
            {
                name: "Orionids",
                code: "ORI",
                parentBody: "1P/Halley (Comet)",
                peakDate: "October 21-22",
                activity: "October 2 - November 7",
                zhr: 25,
                velocity: 66,
                radiant: "Orion constellation",
                description: "Also from Halley's Comet. Fast and bright meteors.",
                color: "#e57373",
                semiMajorAxis: 17.834,
                eccentricity: 0.9671,
                inclination: 162.26,
                longitudeOfAscendingNode: 58.42,
                argumentOfPerihelion: 111.33
            },
            {
                name: "Leonids",
                code: "LEO",
                parentBody: "55P/Tempel-Tuttle (Comet)",
                peakDate: "November 17-18",
                activity: "November 6 - 30",
                zhr: 15,
                velocity: 71,
                radiant: "Leo constellation",
                description: "Famous for meteor storms every 33 years. Tempel-Tuttle has 33-year orbit.",
                color: "#ffd54f",
                semiMajorAxis: 10.334,
                eccentricity: 0.9055,
                inclination: 162.49,
                longitudeOfAscendingNode: 235.26,
                argumentOfPerihelion: 172.5
            },
            {
                name: "Ursids",
                code: "URS",
                parentBody: "8P/Tuttle (Comet)",
                peakDate: "December 22-23",
                activity: "December 17 - 26",
                zhr: 10,
                velocity: 33,
                radiant: "Ursa Minor constellation",
                description: "Minor shower near winter solstice. Tuttle orbits every 13.6 years.",
                color: "#64b5f6",
                semiMajorAxis: 5.699,
                eccentricity: 0.8198,
                inclination: 54.98,
                longitudeOfAscendingNode: 270.34,
                argumentOfPerihelion: 206.79
            },
            {
                name: "Delta Aquariids",
                code: "SDA",
                parentBody: "96P/Machholz (Comet)",
                peakDate: "July 29-30",
                activity: "July 12 - August 23",
                zhr: 20,
                velocity: 41,
                radiant: "Aquarius constellation",
                description: "Southern hemisphere shower. Machholz is a sungrazing comet with 5.3-year orbit.",
                color: "#26c6da",
                semiMajorAxis: 3.029,
                eccentricity: 0.9591,
                inclination: 58.08,
                longitudeOfAscendingNode: 14.72,
                argumentOfPerihelion: 14.73
            },
            {
                name: "Draconids",
                code: "DRA",
                parentBody: "21P/Giacobini-Zinner (Comet)",
                peakDate: "October 8-9",
                activity: "October 6 - 10",
                zhr: 10,
                velocity: 20,
                radiant: "Draco constellation",
                description: "Variable shower. Can produce storms. Parent comet has 6.6-year orbit.",
                color: "#ab47bc",
                semiMajorAxis: 3.52,
                eccentricity: 0.7067,
                inclination: 31.81,
                longitudeOfAscendingNode: 195.41,
                argumentOfPerihelion: 172.53
            },
            {
                name: "Taurids",
                code: "NTA",
                parentBody: "2P/Encke (Comet)",
                peakDate: "November 12-13",
                activity: "September 10 - November 20",
                zhr: 5,
                velocity: 27,
                radiant: "Taurus constellation",
                description: "Long duration, slow meteors. Encke has shortest known period (3.3 years).",
                color: "#ff8a65",
                semiMajorAxis: 2.218,
                eccentricity: 0.8471,
                inclination: 11.78,
                longitudeOfAscendingNode: 334.57,
                argumentOfPerihelion: 186.54
            },
            {
                name: "Alpha Capricornids",
                code: "CAP",
                parentBody: "169P/NEAT (Comet)",
                peakDate: "July 30-31",
                activity: "July 3 - August 15",
                zhr: 5,
                velocity: 23,
                radiant: "Capricornus constellation",
                description: "Known for bright fireballs. NEAT comet discovered in 2002.",
                color: "#aed581",
                semiMajorAxis: 2.622,
                eccentricity: 0.7659,
                inclination: 11.96,
                longitudeOfAscendingNode: 270.53,
                argumentOfPerihelion: 58.12
            },
            {
                name: "Virginids",
                code: "VIR",
                parentBody: "Unknown (Possible asteroidal)",
                peakDate: "March 15",
                activity: "January 25 - April 15",
                zhr: 5,
                velocity: 30,
                radiant: "Virgo constellation",
                description: "Complex shower with multiple radiants. Long duration spring shower.",
                color: "#ba68c8",
                semiMajorAxis: 2.5,
                eccentricity: 0.65,
                inclination: 5.2,
                longitudeOfAscendingNode: 175.4,
                argumentOfPerihelion: 290.5
            },
            {
                name: "Ursae Majorids",
                code: "UMA",
                parentBody: "C/1739 K1 (Comet)",
                peakDate: "December 20",
                activity: "December 13 - 24",
                zhr: 3,
                velocity: 32,
                radiant: "Ursa Major constellation",
                description: "Minor shower. Historical comet observed in 1739.",
                color: "#78909c",
                semiMajorAxis: 28.5,
                eccentricity: 0.975,
                inclination: 62.3,
                longitudeOfAscendingNode: 268.9,
                argumentOfPerihelion: 145.2
            },
            {
                name: "Pi Puppids",
                code: "PPU",
                parentBody: "26P/Grigg-Skjellerup (Comet)",
                peakDate: "April 23-24",
                activity: "April 15 - 28",
                zhr: 10,
                velocity: 18,
                radiant: "Puppis constellation",
                description: "Variable rates. Best in Southern Hemisphere. Comet has 5.1-year orbit.",
                color: "#4dd0e1",
                semiMajorAxis: 3.065,
                eccentricity: 0.6641,
                inclination: 21.11,
                longitudeOfAscendingNode: 213.2,
                argumentOfPerihelion: 359.4
            },
            {
                name: "Aurigids",
                code: "AUR",
                parentBody: "C/1911 N1 Kiess (Comet)",
                peakDate: "September 1",
                activity: "August 28 - September 5",
                zhr: 6,
                velocity: 66,
                radiant: "Auriga constellation",
                description: "Brief but fast meteors. Parent comet has ~2000 year orbit.",
                color: "#fff176",
                semiMajorAxis: 142.8,
                eccentricity: 0.993,
                inclination: 148.5,
                longitudeOfAscendingNode: 158.5,
                argumentOfPerihelion: 195.3
            },
            {
                name: "Andromedids",
                code: "AND",
                parentBody: "3D/Biela (Comet - Disintegrated)",
                peakDate: "November 9-14",
                activity: "September 25 - December 6",
                zhr: 3,
                velocity: 18,
                radiant: "Andromeda constellation",
                description: "Historic meteor storms in 1872, 1885. Parent comet broke apart in 1846.",
                color: "#90a4ae",
                semiMajorAxis: 3.53,
                eccentricity: 0.7513,
                inclination: 12.55,
                longitudeOfAscendingNode: 247.3,
                argumentOfPerihelion: 221.7
            },
            {
                name: "Monocerotids",
                code: "MON",
                parentBody: "C/1917 F1 Mellish (Comet)",
                peakDate: "December 9",
                activity: "November 27 - December 17",
                zhr: 2,
                velocity: 42,
                radiant: "Monoceros constellation",
                description: "Rare outbursts possible. Parent comet has ~145 year orbit.",
                color: "#ffab91",
                semiMajorAxis: 51.7,
                eccentricity: 0.992,
                inclination: 32.7,
                longitudeOfAscendingNode: 93.5,
                argumentOfPerihelion: 121.8
            }
        ];
    }

    /**
     * Load meteor shower UI
     */
    loadMeteorShowerUI() {
        const listContainer = document.getElementById('meteorshower-list');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        this.meteorShowers.forEach((shower, index) => {
            const showerDiv = document.createElement('div');
            showerDiv.className = 'meteorshower-item';
            showerDiv.style.borderLeft = `4px solid ${shower.color}`;
            showerDiv.style.cursor = 'pointer';
            showerDiv.dataset.showerCode = shower.code;
            
            showerDiv.innerHTML = `
                <div class="meteorshower-header">
                    <div class="meteorshower-name">${shower.name}</div>
                    <div class="meteorshower-peak">${shower.peakDate}</div>
                </div>
                <div class="meteorshower-details">
                    <div>🔭 Parent: ${shower.parentBody}</div>
                    <div>📅 Active: ${shower.activity}</div>
                    <div>⚡ Velocity: ${shower.velocity} km/s</div>
                    <div>✨ ZHR: ${shower.zhr} meteors/hour</div>
                    <div>🎯 Radiant: ${shower.radiant}</div>
                    <div style="margin-top: 8px; color: #aaa; font-size: 0.85rem;">${shower.description}</div>
                </div>
            `;

            // Add click event to visualize the meteor shower
            showerDiv.addEventListener('click', () => {
                this.visualizeMeteorShower(shower);
                
                // Update selection UI
                document.querySelectorAll('.meteorshower-item').forEach(item => {
                    item.classList.remove('selected');
                });
                showerDiv.classList.add('selected');
            });

            listContainer.appendChild(showerDiv);
        });

        console.log(`✅ Loaded ${this.meteorShowers.length} meteor showers`);
    }

    /**
     * Visualize a meteor shower in 3D
     */
    visualizeMeteorShower(shower) {
        console.log(`🌌 Visualizing ${shower.name} meteor shower...`);
        
        // Clear previous meteor shower visualization
        this.clearMeteorVisualizations();
        
        this.selectedShower = shower;
        
        // Create orbital path for parent body
        this.createParentBodyOrbit(shower);
        
        // Create meteor particle stream
        this.createMeteorStream(shower);
        
        console.log(`✅ ${shower.name} visualization complete`);
    }

    /**
     * Create orbital path for the parent comet/asteroid
     */
    createParentBodyOrbit(shower) {
        const orbitPoints = [];
        const segments = 200;
        
        // Convert to radians
        const a = shower.semiMajorAxis;
        const e = shower.eccentricity;
        const i = shower.inclination * Math.PI / 180;
        const Omega = shower.longitudeOfAscendingNode * Math.PI / 180;
        const omega = shower.argumentOfPerihelion * Math.PI / 180;
        
        // Calculate elliptical orbit
        for (let j = 0; j <= segments; j++) {
            const theta = (j / segments) * 2 * Math.PI; // True anomaly
            
            // Calculate distance from focus
            const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
            
            // Position in orbital plane
            const xOrb = r * Math.cos(theta);
            const yOrb = r * Math.sin(theta);
            
            // Rotate to 3D space (same as asteroids)
            const cosOmega = Math.cos(omega);
            const sinOmega = Math.sin(omega);
            const cosOmegaBig = Math.cos(Omega);
            const sinOmegaBig = Math.sin(Omega);
            const cosI = Math.cos(i);
            const sinI = Math.sin(i);
            
            const x3d = (cosOmega * cosOmegaBig - sinOmega * sinOmegaBig * cosI) * xOrb +
                       (-sinOmega * cosOmegaBig - cosOmega * sinOmegaBig * cosI) * yOrb;
            
            const y3d = (cosOmega * sinOmegaBig + sinOmega * cosOmegaBig * cosI) * xOrb +
                       (-sinOmega * sinOmegaBig + cosOmega * cosOmegaBig * cosI) * yOrb;
            
            const z3d = (sinOmega * sinI) * xOrb + (cosOmega * sinI) * yOrb;
            
            // Scale to scene units (1 AU = 15 units)
            orbitPoints.push(new THREE.Vector3(x3d * 15, y3d * 15, z3d * 15));
        }
        
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitColor = new THREE.Color(shower.color);
        
        const orbitMaterial = new THREE.LineBasicMaterial({
            color: orbitColor,
            transparent: true,
            opacity: 0.7,
            linewidth: 3
        });
        
        const orbit = new THREE.Line(orbitGeometry, orbitMaterial);
        orbit.name = `meteor_shower_orbit_${shower.code}`;
        orbit.userData = { type: 'meteor_shower_orbit', shower: shower.name };
        
        this.scene.add(orbit);
        
        if (!this.meteorGroups[shower.code]) {
            this.meteorGroups[shower.code] = { orbit: null, particles: [] };
        }
        this.meteorGroups[shower.code].orbit = orbit;
        
        console.log(`✅ Created orbit for ${shower.name} parent body: ${shower.parentBody}`);
    }

    /**
     * Create meteor particle stream along the orbit
     */
    createMeteorStream(shower) {
        const particleCount = Math.floor(shower.zhr / 2); // Number of particles based on ZHR
        const particles = [];
        
        const orbitColor = new THREE.Color(shower.color);
        
        // Create particles along random points of the orbit
        for (let i = 0; i < particleCount; i++) {
            // Random position along the orbit
            const theta = Math.random() * 2 * Math.PI;
            const a = shower.semiMajorAxis;
            const e = shower.eccentricity;
            const inclination = shower.inclination * Math.PI / 180;
            const Omega = shower.longitudeOfAscendingNode * Math.PI / 180;
            const omega = shower.argumentOfPerihelion * Math.PI / 180;
            
            const r = a * (1 - e * e) / (1 + e * Math.cos(theta));
            const xOrb = r * Math.cos(theta);
            const yOrb = r * Math.sin(theta);
            
            // 3D rotation
            const cosOmega = Math.cos(omega);
            const sinOmega = Math.sin(omega);
            const cosOmegaBig = Math.cos(Omega);
            const sinOmegaBig = Math.sin(Omega);
            const cosI = Math.cos(inclination);
            const sinI = Math.sin(inclination);
            
            const x3d = (cosOmega * cosOmegaBig - sinOmega * sinOmegaBig * cosI) * xOrb +
                       (-sinOmega * cosOmegaBig - cosOmega * sinOmegaBig * cosI) * yOrb;
            
            const y3d = (cosOmega * sinOmegaBig + sinOmega * cosOmegaBig * cosI) * xOrb +
                       (-sinOmega * sinOmegaBig + cosOmega * cosOmegaBig * cosI) * yOrb;
            
            const z3d = (sinOmega * sinI) * xOrb + (cosOmega * sinI) * yOrb;
            
            // Create small sphere for meteor particle
            const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);
            const particleMaterial = new THREE.MeshBasicMaterial({
                color: orbitColor,
                transparent: true,
                opacity: 0.8
            });
            
            const particle = new THREE.Mesh(particleGeometry, particleMaterial);
            particle.position.set(x3d * 15, y3d * 15, z3d * 15);
            particle.userData = { 
                type: 'meteor_particle',
                shower: shower.name,
                angle: theta
            };
            
            this.scene.add(particle);
            particles.push(particle);
            
            // Create trail behind each particle
            this.createParticleTrail(particle, shower, theta);
        }
        
        if (!this.meteorGroups[shower.code]) {
            this.meteorGroups[shower.code] = { orbit: null, particles: [] };
        }
        this.meteorGroups[shower.code].particles = particles;
        
        console.log(`✅ Created ${particleCount} meteor particles for ${shower.name}`);
    }

    /**
     * Create trail line behind a meteor particle
     */
    createParticleTrail(particle, shower, angle) {
        const trailLength = 10; // Number of trail segments
        const trailPoints = [];
        
        const a = shower.semiMajorAxis;
        const e = shower.eccentricity;
        const i = shower.inclination * Math.PI / 180;
        const Omega = shower.longitudeOfAscendingNode * Math.PI / 180;
        const omega = shower.argumentOfPerihelion * Math.PI / 180;
        
        // Create points going backwards along the orbit
        for (let j = 0; j < trailLength; j++) {
            const trailAngle = angle - (j * 0.05); // Go backwards
            const r = a * (1 - e * e) / (1 + e * Math.cos(trailAngle));
            const xOrb = r * Math.cos(trailAngle);
            const yOrb = r * Math.sin(trailAngle);
            
            // 3D rotation
            const cosOmega = Math.cos(omega);
            const sinOmega = Math.sin(omega);
            const cosOmegaBig = Math.cos(Omega);
            const sinOmegaBig = Math.sin(Omega);
            const cosI = Math.cos(i);
            const sinI = Math.sin(i);
            
            const x3d = (cosOmega * cosOmegaBig - sinOmega * sinOmegaBig * cosI) * xOrb +
                       (-sinOmega * cosOmegaBig - cosOmega * sinOmegaBig * cosI) * yOrb;
            
            const y3d = (cosOmega * sinOmegaBig + sinOmega * cosOmegaBig * cosI) * xOrb +
                       (-sinOmega * sinOmegaBig + cosOmega * cosOmegaBig * cosI) * yOrb;
            
            const z3d = (sinOmega * sinI) * xOrb + (cosOmega * sinI) * yOrb;
            
            trailPoints.push(new THREE.Vector3(x3d * 15, y3d * 15, z3d * 15));
        }
        
        const trailGeometry = new THREE.BufferGeometry().setFromPoints(trailPoints);
        const trailColor = new THREE.Color(shower.color);
        
        const trailMaterial = new THREE.LineBasicMaterial({
            color: trailColor,
            transparent: true,
            opacity: 0.4,
            linewidth: 1
        });
        
        const trail = new THREE.Line(trailGeometry, trailMaterial);
        trail.userData = { 
            type: 'meteor_trail',
            parentParticle: particle
        };
        
        this.scene.add(trail);
        particle.userData.trail = trail;
    }

    /**
     * Clear all meteor shower visualizations
     */
    clearMeteorVisualizations() {
        Object.keys(this.meteorGroups).forEach(code => {
            const group = this.meteorGroups[code];
            
            // Remove orbit
            if (group.orbit) {
                this.scene.remove(group.orbit);
                group.orbit.geometry.dispose();
                group.orbit.material.dispose();
            }
            
            // Remove particles and trails
            group.particles.forEach(particle => {
                if (particle.userData.trail) {
                    this.scene.remove(particle.userData.trail);
                    particle.userData.trail.geometry.dispose();
                    particle.userData.trail.material.dispose();
                }
                this.scene.remove(particle);
                particle.geometry.dispose();
                particle.material.dispose();
            });
        });
        
        this.meteorGroups = {};
        this.selectedShower = null;
        
        console.log('🧹 Cleared all meteor shower visualizations');
    }

    /**
     * Hide all meteor visualizations (without disposing)
     */
    hideAllMeteorVisualizations() {
        Object.keys(this.meteorGroups).forEach(code => {
            const group = this.meteorGroups[code];
            
            if (group.orbit) {
                group.orbit.visible = false;
            }
            
            group.particles.forEach(particle => {
                particle.visible = false;
                if (particle.userData.trail) {
                    particle.userData.trail.visible = false;
                }
            });
        });
    }
}

// Export for use in other modules
window.MeteorShowerService = MeteorShowerService;
