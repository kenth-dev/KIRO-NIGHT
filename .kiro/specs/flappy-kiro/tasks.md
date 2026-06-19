# Implementation Plan

## Overview

This implementation plan covers the full build-out of Flappy Kiro — a browser-based retro arcade game built with vanilla JavaScript and HTML5 Canvas. Tasks are ordered to build foundational infrastructure first, then layer on game systems, rendering, audio, and polish. Property-based tests validate correctness properties defined in the design document using fast-check and Vitest.

## Tasks

- [ ] 1. Project Setup and Configuration
  - [ ] 1.1 Create the project folder structure matching the design document module layout (src/, src/engine/, src/systems/, src/rendering/, src/entities/, src/config/, src/utils/, tests/, tests/properties/, tests/unit/, tests/integration/)
  - [ ] 1.2 Create `src/index.html` with an HTML5 canvas element (480x320 logical pixels), module script loading for `main.js`, meta tags for viewport and touch support, and CSS for pixelated scaling
  - [ ] 1.3 Create `src/config/GameConfig.js` exporting the full configuration object with all tunable constants (canvas, physics, obstacles, difficulty, scoring, kiro, rendering, clouds, audio, storage, achievements) as defined in the design document
  - [ ] 1.4 Initialize package.json with Vitest and fast-check as dev dependencies, configure ES module support, and add test scripts (npx vitest --run)
- [ ] 2. Core Engine Infrastructure
  - [ ] 2.1 Implement `src/engine/EventBus.js` with on(event, callback), off(event, callback), and emit(event, data) methods for publish/subscribe communication between subsystems
  - [ ] 2.2 Implement `src/engine/StateMachine.js` with exactly four states (Title, Playing, Paused, Game_Over), valid transition validation (reject invalid transitions silently), and state change notification via the EventBus
  - [ ] 2.3 Implement `src/engine/GameEngine.js` with the fixed-timestep game loop using requestAnimationFrame, delta-time capping at 50ms, accumulator-based fixed step updates, interpolated rendering, and subsystem coordination
  - [ ] 2.4 Create `src/main.js` as the entry point that bootstraps the GameEngine, initializes all subsystems, and sets the initial state to Title
  - [ ] 2.5 Write property tests for delta-time capping (Property 1) and state machine transition validity (Property 2) in `tests/properties/state-machine.property.test.js`
- [ ] 3. Utility Modules
  - [ ] 3.1 Implement `src/utils/MathUtils.js` with lerp, clamp, randomRange, and other math utility functions used across subsystems
  - [ ] 3.2 Implement `src/utils/ObjectPool.js` as a generic pre-allocated object pool with acquire, release, reset operations, and fixed maximum size
  - [ ] 3.3 Implement `src/utils/StorageManager.js` wrapping localStorage with try/catch error handling, namespaced key prefix ('flappy-kiro-'), and fallback to default values when storage is unavailable
- [ ] 4. Physics System
  - [ ] 4.1 Implement `src/systems/PhysicsSystem.js` with gravity application (velocity += gravity * deltaTime), drag damping (velocity *= (1 - drag * deltaTime)), velocity clamping between max upward speed and terminal velocity, and position update (position += velocity * deltaTime)
  - [ ] 4.2 Add flap impulse application that applies immediate upward velocity while preserving momentum
  - [ ] 4.3 Add render interpolation support: store previous position and compute interpolated position using alpha factor (prevY + (currentY - prevY) * alpha)
  - [ ] 4.4 Add reset method to initialize Kiro at centered vertical position with zero velocity when transitioning to Playing state
  - [ ] 4.5 Write property tests for physics velocity update (Property 3), velocity clamping invariant (Property 4), position update formula (Property 5), and render interpolation correctness (Property 6) in `tests/properties/physics.property.test.js`
- [ ] 5. Input Handler
  - [ ] 5.1 Implement `src/systems/InputHandler.js` with keyboard (spacebar), mouse click, and touch input normalization, emitting a single flap event per press-release cycle
  - [ ] 5.2 Add input debouncing to prevent repeated flap events from held keys (keydown repeat events), and multi-touch deduplication (one flap per frame regardless of touch points)
  - [ ] 5.3 Add state-aware input suppression: ignore flap inputs when game state is not Playing, and prevent default browser behavior for all captured events
  - [ ] 5.4 Write property tests for input debouncing (Property 8), flap suppression outside Playing state (Property 9), and multi-touch deduplication (Property 10) in `tests/properties/input.property.test.js`
- [ ] 6. Player Character Entity
  - [ ] 6.1 Implement `src/entities/Kiro.js` with player state (position, velocity, hitbox, rotation, animation state, squash/stretch, glow intensity, isAlive), hitbox at 75% of sprite size, and animation state management
  - [ ] 6.2 Add sprite rotation calculation based on vertical velocity, clamped between -30 degrees (ascending) and +90 degrees (descending)
  - [ ] 6.3 Add squash-and-stretch animation logic triggered on flap impulse, lasting no longer than 300ms
  - [ ] 6.4 Add idle floating animation (vertical oscillation of up to 4px over 1-2 second cycle) for title screen display
  - [ ] 6.5 Write property test for sprite rotation bounds (Property 7) in `tests/properties/physics.property.test.js`
- [ ] 7. Obstacle System
  - [ ] 7.1 Implement `src/entities/Obstacle.js` as a single obstacle pair entity with gap center, gap size, top/bottom heights, hitboxes, passed/scored flags, variant index, and active state
  - [ ] 7.2 Implement `src/systems/ObstacleManager.js` with obstacle spawning using ObjectPool, gap placement within safe margins (10% from boundaries), gap size bounded between 1.5x and 3x Kiro hitbox height, and horizontal spacing from DifficultyController
  - [ ] 7.3 Add obstacle scrolling (x -= speed * deltaTime), off-screen recycling back into the pool, and frame-rate-independent movement
  - [ ] 7.4 Write property tests for obstacle gap size bounds (Property 11), gap placement within safe margins (Property 12), and obstacle scroll formula (Property 13) in `tests/properties/obstacles.property.test.js`
- [ ] 8. Collision Detection
  - [ ] 8.1 Implement `src/systems/CollisionDetector.js` with AABB overlap detection between Kiro hitbox and all active obstacle hitboxes
  - [ ] 8.2 Add boundary collision detection (top/bottom of playable area)
  - [ ] 8.3 Add sweep-based collision detection for high velocities to prevent tunneling through thin obstacles
  - [ ] 8.4 Add invincibility frames support (defaulting to disabled) for future gameplay modes
  - [ ] 8.5 Write property tests for AABB collision correctness (Property 14), boundary collision detection (Property 15), and sweep collision prevention (Property 16) in `tests/properties/collision.property.test.js`
- [ ] 9. Score Manager
  - [ ] 9.1 Implement `src/systems/ScoreManager.js` with score increment when Kiro passes trailing edge of obstacle (exactly one point per pair, idempotent), high score persistence via StorageManager, and score reset on game start
  - [ ] 9.2 Add combo streak tracking: increment on consecutive passes, reset to zero on collision, milestone detection every 5 passes with bonus equal to current streak count
  - [ ] 9.3 Add high score comparison logic: update stored high score only when current score is strictly greater
  - [ ] 9.4 Write property tests for score increment idempotency (Property 17), high score maximum logic (Property 18), combo streak consistency (Property 28), and combo milestone bonus (Property 29) in `tests/properties/scoring.property.test.js`
- [ ] 10. Difficulty Controller
  - [ ] 10.1 Implement `src/systems/DifficultyController.js` with linear interpolation of scroll speed (base to 2x base), gap size (base down to min), and horizontal spacing (base down to min) based on score progress toward max threshold
  - [ ] 10.2 Add smoothness constraint: no single score increment causes speed change greater than 5% of current value
  - [ ] 10.3 Add minimum reaction time guarantee: spacing/speed ratio must be at least 400ms at all difficulty levels
  - [ ] 10.4 Add reset method to restore all parameters to base values on game start
  - [ ] 10.5 Write property tests for difficulty parameters bounded (Property 19), scaling smoothness (Property 20), and minimum reaction time guarantee (Property 21) in `tests/properties/difficulty.property.test.js`
- [ ] 11. Renderer and Canvas Setup
  - [ ] 11.1 Implement `src/rendering/Renderer.js` with canvas drawing orchestration, logical resolution rendering (480x320), nearest-neighbor scaling to viewport, aspect ratio preservation, and separate update/render phase management
  - [ ] 11.2 Add responsive canvas scaling: recalculate scale on viewport resize, center canvas, fill remaining space with solid background color, scale down proportionally if viewport is smaller than logical resolution
  - [ ] 11.3 Add screen shake effect with configurable intensity and duration (300-500ms), triggered on collision
  - [ ] 11.4 Add death animation rendering (500-1000ms tumble/fade), freezing obstacle and background movement during the animation
  - [ ] 11.5 Add screen flash overlay (semi-transparent white, 100-200ms) on collision
  - [ ] 11.6 Write property test for canvas scaling preserving aspect ratio (Property 32) in `tests/properties/rendering.property.test.js`
- [ ] 12. Background and Atmosphere
  - [ ] 12.1 Implement `src/rendering/Background.js` with parallax multi-layer scrolling (at least 3 layers, furthest at ≤25% of foreground scroll speed)
  - [ ] 12.2 Add atmosphere phase cycling through day → dusk → night → haunted → dusk → day, each phase lasting 30-60 seconds (configurable at 45s)
  - [ ] 12.3 Add smooth color interpolation between phases over 5-10 seconds (configurable at 7s), with ambient lighting adjustments per phase
  - [ ] 12.4 Write property tests for background phase cycling (Property 23) and color interpolation (Property 24) in `tests/properties/rendering.property.test.js`
- [ ] 13. CRT Post-Processing Effect
  - [ ] 13.1 Implement `src/rendering/CRTEffect.js` with scanline overlay and vignette post-processing applied to the canvas output
  - [ ] 13.2 Add toggle support: enable/disable immediately without restart, persist preference to localStorage, default to disabled
- [ ] 14. Particle System
  - [ ] 14.1 Implement `src/systems/ParticleSystem.js` with particle entity management, active particle cap of 50, and update/render lifecycle
  - [ ] 14.2 Implement `src/entities/Particle.js` as the individual particle entity with position, velocity, life, opacity, color, type, layer, and active state
  - [ ] 14.3 Add trail particle emission (2-4 particles per frame behind Kiro, fade out over 300-600ms)
  - [ ] 14.4 Add collision burst emission (5-15 particles at impact point, dispersing over 500ms)
  - [ ] 14.5 Add ambient particle effects (floating spirits, drifting fog) that vary by background phase
  - [ ] 14.6 Write property test for ambient particle count cap (Property 22) in `tests/properties/rendering.property.test.js`
- [ ] 15. Cloud System
  - [ ] 15.1 Add layered cloud rendering to the Particle System across three depth layers (distant, midground, foreground) rendered in back-to-front order
  - [ ] 15.2 Implement distant layer clouds: ≤50% midground scale, opacity 0.15-0.35, speed ≤50% of midground speed
  - [ ] 15.3 Implement midground layer clouds: baseline scale, opacity 0.35-0.6, baseline drift speed
  - [ ] 15.4 Implement foreground layer clouds: ≥150% midground scale, opacity 0.6-0.85, speed ≥150% of midground speed
  - [ ] 15.5 Add cloud variation (±20% size variance), randomized spawn intervals (2-8s per layer), opacity fade-in/fade-out (0.5-1.5s), and maximum opacity cap of 0.85
  - [ ] 15.6 Write property tests for cloud layer parameter bounds (Property 36), cloud z-ordering invariant (Property 37), and cloud layer speed independence (Property 38) in `tests/properties/clouds.property.test.js`
- [ ] 16. UI Manager
  - [ ] 16.1 Implement `src/rendering/UIManager.js` with HUD rendering (current score, combo streak display, pause button), smooth transitions (150-300ms), and button click handling
  - [ ] 16.2 Add title screen rendering: animated logo, Start Game button, Settings button, CRT toggle, high score display, idle Kiro animation with parallax background
  - [ ] 16.3 Add game over overlay: final score, best score, new high score indicator, Restart button, Return to Menu button, statistics (distance, obstacles passed, time played), staggered fade-in (800-1200ms total)
  - [ ] 16.4 Add pause overlay: Resume button, Restart button, Return to Menu button, visible pause trigger for touch devices
  - [ ] 16.5 Add floating score popup animation (animate upward, fade out over 500-1000ms) and score scale-up effect (≤200ms)
  - [ ] 16.6 Add combo streak milestone visual effect (≤2 seconds, non-obscuring) and achievement notification rendering (3 seconds, non-obscuring)
  - [ ] 16.7 Add settings panel with audio volume sliders and CRT toggle
  - [ ] 16.8 Write property test for minimum button touch target (Property 33) in `tests/properties/rendering.property.test.js`
- [ ] 17. Sprite and Asset Loading
  - [ ] 17.1 Implement `src/rendering/SpriteSheet.js` with sprite image loading, frame management, and fallback procedural rendering (geometric ghost shape) if ghosty.png fails to load
  - [ ] 17.2 Render Kiro using the ghosty.png sprite with glow effects (subtle pulsing, intensifies on flap), and render obstacles as haunted-themed vertical structures with distinct color palette
- [ ] 18. Audio Manager
  - [ ] 18.1 Implement `src/systems/AudioManager.js` with Web Audio API context (lazy creation on first user interaction), sound effect loading, and concurrent playback support
  - [ ] 18.2 Add background music: looping chiptune playback, start on Playing state, stop on Game_Over, suspend on Paused, resume from same position on resume
  - [ ] 18.3 Add sound effects: flap (overlapping instances), score, collision, game over, near-miss (within 20% of gap edge), and menu interaction sounds
  - [ ] 18.4 Add volume controls: independent music and SFX volume (0-100% in ≤10% increments, snapped to nearest 0.1), mute toggle, persistence to localStorage
  - [ ] 18.5 Write property tests for volume control snapping (Property 25) and near-miss detection geometry (Property 26) in `tests/properties/rendering.property.test.js`
- [ ] 19. Achievement System
  - [ ] 19.1 Implement `src/systems/AchievementSystem.js` with at least 5 score-based milestone achievements (10, 25, 50, 100, 200), first-time unlock detection, notification triggering, and persistence to localStorage
  - [ ] 19.2 Add achievement idempotency: do not re-trigger notifications or modify state for already-unlocked achievements
  - [ ] 19.3 Add achievement viewer UI integration: display all achievements with name, threshold, and locked/unlocked status
  - [ ] 19.4 Write property tests for achievement unlock idempotency (Property 30) and first-time threshold unlock (Property 31) in `tests/properties/scoring.property.test.js`
- [ ] 20. Rare Events System
  - [ ] 20.1 Implement rare visual event evaluation in the GameEngine: 1-5% chance per scoring cycle, decorative animation (2-4 seconds), no gameplay state alteration, and 30-second cooldown between events
  - [ ] 20.2 Write property tests for rare event not altering game state (Property 34) and cooldown enforcement (Property 35) in `tests/properties/rare-events.property.test.js`
- [ ] 21. Delta-Time and Pause Resume Safety
  - [ ] 21.1 Implement delta-time accumulator reset in GameEngine when transitioning from Paused to Playing, ensuring the first frame after resume uses no elapsed pause time
  - [ ] 21.2 Write property test for delta-time accumulator reset on resume (Property 27) in `tests/properties/state-machine.property.test.js`
- [ ] 22. Integration and Final Assembly
  - [ ] 22.1 Wire all subsystems together in `src/main.js`: initialize EventBus, create all managers/systems, register event listeners, connect input → physics → collision → scoring → difficulty → rendering pipeline
  - [ ] 22.2 Implement full game flow: Title → Playing (start), Playing → Paused (escape/pause button), Paused → Playing (resume), Playing → Game_Over (collision), Game_Over → Playing (restart), Game_Over → Title (menu)
  - [ ] 22.3 Implement game reset logic: clear obstacles, reset score/combo/difficulty, reposition Kiro, used by both Restart and Return to Menu transitions
  - [ ] 22.4 Ensure all persistent data flows work end-to-end: high score, volume settings, CRT preference, achievements stored and restored across sessions
  - [ ] 22.5 Verify responsive layout works across desktop and mobile viewports with proper canvas scaling and touch targets
- [ ] 23. Unit and Integration Tests
  - [ ] 23.1 Write unit tests in `tests/unit/` covering: state machine initial state, specific transition sequences, physics initialization, input event emission, obstacle recycling, score reset, audio event triggers, UI element presence, collision response timing, and death animation duration
  - [ ] 23.2 Write integration tests in `tests/integration/` covering: full game loop (start → pass obstacle → score = 1), pause/resume cycle preservation, localStorage round-trip persistence, difficulty progression at score 50, and audio context user gesture requirement

## Task Dependency Graph

```json
{
  "waves": [
    [1],
    [2, 3],
    [4, 5, 9, 10, 11, 18],
    [6, 7, 8, 12, 13, 14, 16, 17, 19, 20, 21],
    [15],
    [22],
    [23]
  ]
}
```

## Notes

- All property-based tests use fast-check with a minimum of 100 iterations per property.
- Each property test must include a comment referencing the design property (e.g., `// Feature: flappy-kiro, Property 3: Physics velocity update`).
- Unit and integration tests use Vitest as the test runner.
- The game runs entirely from static files with no build step — all code uses ES6+ modules loaded via `<script type="module">`.
- Audio context is created lazily on first user interaction to comply with browser autoplay policies.
- All localStorage operations are wrapped in try/catch with fallback to defaults for private browsing compatibility.
