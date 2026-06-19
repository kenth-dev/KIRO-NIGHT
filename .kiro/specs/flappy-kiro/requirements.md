# Requirements Document

## Introduction

Flappy Kiro is a browser-based retro arcade game inspired by classic side-scrolling games. Players control a small ghost character named Kiro, navigating through a haunted pixel-art world filled with obstacles. The game features endless side-scrolling gameplay with increasing difficulty, retro 8-bit/16-bit aesthetics, chiptune audio, and polished game feel. It runs entirely in the browser with no external dependencies, supporting keyboard, mouse, and touch input across desktop and mobile devices.

## Glossary

- **Game_Engine**: The core module responsible for the game loop, frame timing, and coordinating all subsystems
- **Kiro**: The player-controlled ghost character sprite
- **Physics_System**: The subsystem handling gravity, upward impulse, and movement calculations
- **Renderer**: The subsystem responsible for drawing all visual elements to the HTML5 canvas
- **Collision_Detector**: The subsystem that checks for intersections between Kiro and obstacles or boundaries
- **Obstacle_Manager**: The subsystem that spawns, positions, and recycles pipe/pillar obstacles
- **Score_Manager**: The subsystem that tracks current score, high score, and score persistence
- **Input_Handler**: The subsystem that captures and normalizes keyboard, mouse, and touch events
- **Audio_Manager**: The subsystem that loads and plays sound effects and background music
- **UI_Manager**: The subsystem responsible for rendering menus, overlays, HUD, and screen transitions
- **Difficulty_Controller**: The subsystem that adjusts game parameters over time to increase challenge
- **Particle_System**: The subsystem that manages decorative particle effects
- **Achievement_System**: The subsystem that tracks and awards milestone-based achievements
- **Playable_Area**: The visible game canvas region where Kiro can exist without triggering game over
- **Obstacle_Gap**: The vertical space between the top and bottom segments of an obstacle pair
- **Parallax_Background**: A multi-layered scrolling background where layers move at different speeds to create depth
- **CRT_Effect**: A post-processing visual filter that simulates the look of old cathode-ray tube monitors

## Requirements

### Requirement 1: Core Game Loop

**User Story:** As a player, I want the game to run at a smooth and consistent frame rate, so that gameplay feels responsive and visually fluid.

#### Acceptance Criteria

1. THE Game_Engine SHALL execute the game loop targeting 60 frames per second using requestAnimationFrame
2. THE Game_Engine SHALL use delta-time calculations to ensure consistent game speed regardless of actual frame rate
3. THE Game_Engine SHALL manage distinct game states including Title, Playing, Paused, and Game_Over
4. WHEN the game state transitions from one state to another, THE Game_Engine SHALL notify all subsystems of the state change

### Requirement 2: Player Character Physics

**User Story:** As a player, I want Kiro to respond to my input with satisfying floaty movement, so that controlling the character feels fun and intuitive.

#### Acceptance Criteria

1. WHILE the game state is Playing, THE Physics_System SHALL apply a constant downward gravitational acceleration to Kiro each frame
2. WHEN the player provides a flap input, THE Physics_System SHALL apply an upward impulse to Kiro, overriding any current downward velocity
3. THE Physics_System SHALL clamp Kiro vertical velocity to a maximum downward speed to prevent uncontrollable falling
4. WHEN Kiro receives an upward impulse, THE Renderer SHALL apply a squash-and-stretch animation to Kiro for visual feedback
5. THE Physics_System SHALL calculate Kiro position using the formula: position = position + velocity * deltaTime

### Requirement 3: Player Input Handling

**User Story:** As a player, I want to control Kiro using keyboard, mouse, or touch, so that I can play on any device.

#### Acceptance Criteria

1. WHEN the player presses the Spacebar key, THE Input_Handler SHALL emit a flap event
2. WHEN the player clicks the left mouse button on the game canvas, THE Input_Handler SHALL emit a flap event
3. WHEN the player touches the game canvas on a touchscreen device, THE Input_Handler SHALL emit a flap event
4. THE Input_Handler SHALL prevent default browser behavior for all captured input events to avoid unintended scrolling or navigation
5. WHILE the game state is not Playing, THE Input_Handler SHALL ignore flap inputs and not emit flap events

### Requirement 4: Obstacle Generation and Management

**User Story:** As a player, I want obstacles to appear at regular intervals with navigable gaps, so that I have a clear challenge to overcome.

#### Acceptance Criteria

1. WHILE the game state is Playing, THE Obstacle_Manager SHALL spawn obstacle pairs at regular horizontal intervals ahead of Kiro
2. THE Obstacle_Manager SHALL position each obstacle pair with a vertical gap sized to allow Kiro to pass through
3. THE Obstacle_Manager SHALL randomize the vertical position of the gap for each obstacle pair within the Playable_Area bounds
4. WHEN an obstacle pair scrolls completely off the left edge of the screen, THE Obstacle_Manager SHALL remove the obstacle pair from the active set and recycle it
5. THE Obstacle_Manager SHALL scroll all active obstacles from right to left at the current game scroll speed

### Requirement 5: Collision Detection

**User Story:** As a player, I want collisions to be detected accurately, so that the game feels fair and predictable.

#### Acceptance Criteria

1. THE Collision_Detector SHALL check for overlap between Kiro hitbox and all active obstacle hitboxes every frame during the Playing state
2. WHEN Kiro hitbox overlaps with any obstacle hitbox, THE Collision_Detector SHALL trigger a collision event
3. WHEN Kiro position moves outside the top or bottom boundary of the Playable_Area, THE Collision_Detector SHALL trigger a boundary collision event
4. THE Collision_Detector SHALL use pixel-level hitbox approximation that closely matches the visual outline of Kiro and obstacle sprites
5. WHEN a collision event is triggered, THE Game_Engine SHALL transition the game state to Game_Over

### Requirement 6: Scoring

**User Story:** As a player, I want to earn points for passing obstacles and see my score, so that I have a sense of progression and achievement.

#### Acceptance Criteria

1. WHEN Kiro horizontal position passes the trailing edge of an obstacle pair, THE Score_Manager SHALL increment the current score by one point
2. THE Score_Manager SHALL display the current score on the game HUD during the Playing state
3. WHEN the game state transitions to Game_Over, THE Score_Manager SHALL compare the current score to the stored high score and update the high score if the current score is greater
4. THE Score_Manager SHALL persist the high score to browser localStorage so that the high score survives page reloads
5. WHEN a point is scored, THE UI_Manager SHALL display a floating score popup near Kiro for visual feedback

### Requirement 7: Difficulty Progression

**User Story:** As a player, I want the game to get gradually harder, so that gameplay remains engaging over time.

#### Acceptance Criteria

1. WHILE the game state is Playing, THE Difficulty_Controller SHALL increase the scroll speed incrementally as the score increases
2. THE Difficulty_Controller SHALL reduce the Obstacle_Gap size as the score increases, down to a defined minimum gap size
3. THE Difficulty_Controller SHALL cap all difficulty parameters at defined maximum values to prevent the game from becoming impossible
4. THE Difficulty_Controller SHALL apply difficulty changes smoothly over time rather than in abrupt jumps

### Requirement 8: Visual Rendering and Art Style

**User Story:** As a player, I want the game to have a charming retro pixel-art aesthetic with ghost-themed visuals, so that the game feels polished and visually appealing.

#### Acceptance Criteria

1. THE Renderer SHALL draw all game elements using an HTML5 Canvas element at a logical pixel resolution consistent with 8-bit/16-bit art styles
2. THE Renderer SHALL render Kiro as a ghost character sprite with a subtle idle floating animation
3. THE Renderer SHALL render obstacles as haunted-themed vertical structures visually distinct from the background
4. THE Renderer SHALL draw a Parallax_Background with at least three layers scrolling at different speeds to create depth
5. THE Renderer SHALL scale the canvas to fill the browser viewport while preserving the pixel-art aspect ratio using nearest-neighbor interpolation
6. THE Particle_System SHALL render ambient particle effects including floating spirits and drifting fog that do not obscure gameplay elements

### Requirement 9: Background Atmosphere Transitions

**User Story:** As a player, I want the background to transition between day, dusk, and night over time, so that the world feels alive and varied.

#### Acceptance Criteria

1. WHILE the game state is Playing, THE Renderer SHALL cycle the background palette through day, dusk, and night phases based on elapsed play time
2. THE Renderer SHALL transition between background phases using smooth color interpolation over a defined duration
3. THE Renderer SHALL ensure that obstacles and Kiro remain clearly visible against all background phases

### Requirement 10: Audio System

**User Story:** As a player, I want retro sound effects and music to accompany gameplay, so that the arcade atmosphere is enhanced.

#### Acceptance Criteria

1. WHEN the game state transitions to Playing, THE Audio_Manager SHALL play looping chiptune background music
2. WHEN a flap event occurs, THE Audio_Manager SHALL play a flap sound effect
3. WHEN a point is scored, THE Audio_Manager SHALL play a score sound effect
4. WHEN a collision event is triggered, THE Audio_Manager SHALL play a collision sound effect
5. WHEN the game state transitions to Game_Over, THE Audio_Manager SHALL play a game over sound effect and stop the background music
6. THE Audio_Manager SHALL allow the player to mute or unmute all audio via a toggle control

### Requirement 11: Title Screen

**User Story:** As a player, I want a welcoming title screen with the game logo, so that I know what game I am playing and can choose to start.

#### Acceptance Criteria

1. WHEN the game first loads, THE UI_Manager SHALL display a title screen featuring the Flappy Kiro logo and a Start Game button
2. WHEN the player activates the Start Game button, THE Game_Engine SHALL transition the game state to Playing
3. THE UI_Manager SHALL display the persisted high score on the title screen

### Requirement 12: Game Over Screen

**User Story:** As a player, I want to see my final score and options after losing, so that I can decide to retry or return to the menu.

#### Acceptance Criteria

1. WHEN the game state transitions to Game_Over, THE UI_Manager SHALL display a Game Over overlay showing the final score and the best score
2. THE UI_Manager SHALL display a Restart button on the Game Over overlay
3. THE UI_Manager SHALL display a Return to Menu button on the Game Over overlay
4. WHEN the player activates the Restart button, THE Game_Engine SHALL reset all game state and transition to Playing
5. WHEN the player activates the Return to Menu button, THE Game_Engine SHALL reset all game state and transition to Title
6. WHEN the game state transitions to Game_Over, THE Renderer SHALL apply a screen shake effect for impact feedback

### Requirement 13: Pause Functionality

**User Story:** As a player, I want to pause the game, so that I can take a break without losing progress.

#### Acceptance Criteria

1. WHEN the player presses the Escape key during the Playing state, THE Game_Engine SHALL transition the game state to Paused
2. WHILE the game state is Paused, THE Game_Engine SHALL stop updating game logic and rendering movement
3. WHILE the game state is Paused, THE UI_Manager SHALL display a pause overlay with a Resume button and a Return to Menu button
4. WHEN the player activates the Resume button, THE Game_Engine SHALL transition the game state back to Playing
5. WHEN the player activates the Return to Menu button from the pause overlay, THE Game_Engine SHALL reset all game state and transition to Title

### Requirement 14: Combo Streak System

**User Story:** As a player, I want to be rewarded for consecutive successful passes, so that I feel encouraged to maintain my focus.

#### Acceptance Criteria

1. WHEN Kiro passes consecutive obstacles without collision, THE Score_Manager SHALL track the current combo streak count
2. WHEN the combo streak reaches defined milestone thresholds, THE UI_Manager SHALL display a combo streak visual effect
3. WHEN a collision occurs, THE Score_Manager SHALL reset the combo streak count to zero

### Requirement 15: Achievement System

**User Story:** As a player, I want to unlock achievements for reaching score milestones, so that I have long-term goals to work toward.

#### Acceptance Criteria

1. THE Achievement_System SHALL define a set of score-based milestone achievements
2. WHEN the player reaches a score milestone for the first time, THE Achievement_System SHALL unlock the corresponding achievement and display a notification
3. THE Achievement_System SHALL persist unlocked achievements to browser localStorage
4. THE UI_Manager SHALL provide a way for the player to view all achievements and their unlock status

### Requirement 16: CRT Visual Effect Toggle

**User Story:** As a player, I want to optionally enable a retro CRT screen effect, so that I can customize my visual experience.

#### Acceptance Criteria

1. WHERE the CRT_Effect option is enabled, THE Renderer SHALL apply scanline and vignette post-processing effects to the canvas output
2. THE UI_Manager SHALL provide a toggle control for enabling or disabling the CRT_Effect
3. THE Renderer SHALL persist the CRT_Effect preference to browser localStorage

### Requirement 17: Responsive Layout

**User Story:** As a player, I want the game to work well on both desktop and mobile screens, so that I can play anywhere.

#### Acceptance Criteria

1. THE Renderer SHALL scale the game canvas to fit the available viewport dimensions while maintaining the correct aspect ratio
2. WHEN the browser viewport is resized, THE Renderer SHALL recalculate and apply the appropriate canvas scale
3. THE UI_Manager SHALL size all interactive buttons large enough to be easily activated by touch on mobile devices

### Requirement 18: Collision Visual Feedback

**User Story:** As a player, I want clear visual feedback when a collision occurs, so that I understand what happened.

#### Acceptance Criteria

1. WHEN a collision event is triggered, THE Renderer SHALL flash the screen briefly to indicate impact
2. WHEN a collision event is triggered, THE Renderer SHALL display a brief death animation for Kiro before showing the Game Over screen

### Requirement 19: Easter Eggs and Rare Events

**User Story:** As a player, I want occasional surprises during gameplay, so that I feel compelled to keep playing and discover secrets.

#### Acceptance Criteria

1. WHILE the game state is Playing, THE Game_Engine SHALL have a low probability of triggering a rare visual event each scoring cycle
2. WHEN a rare visual event is triggered, THE Renderer SHALL display a unique animation or sprite that does not affect gameplay mechanics

### Requirement 20: Code Architecture

**User Story:** As a developer, I want the codebase to be modular and maintainable, so that future updates and debugging are straightforward.

#### Acceptance Criteria

1. THE Game_Engine SHALL separate game logic, rendering, input handling, audio, collision detection, and UI management into distinct modules
2. THE Game_Engine SHALL use object-oriented or component-based design patterns for organizing game entities
3. THE Game_Engine SHALL run entirely in the browser without requiring any server-side processing or external runtime dependencies to play
