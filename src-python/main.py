import pygame
import math
import random

# Constants
WIDTH, HEIGHT = 800, 600
FPS = 60
ARENA_RADIUS_BASE = 250
PLAYER_RADIUS = 20
PROJECTILE_RADIUS = 5
PROJECTILE_SPEED = 800
RECOIL_FORCE = 300
FRICTION = 0.98 # Simple friction approximation if needed, but we want "indefinite" movement?
# "Movement continues indefinitely until altered..." -> No friction.

class Entity:
    def __init__(self, x, y, radius):
        self.x = x
        self.y = y
        self.radius = radius
        self.vx = 0
        self.vy = 0
        self.should_remove = False

    def update(self, dt):
        self.x += self.vx * dt
        self.y += self.vy * dt

    def draw(self, screen, center_x, center_y):
        pass

class Projectile(Entity):
    def __init__(self, x, y, angle, owner_id):
        super().__init__(x, y, PROJECTILE_RADIUS)
        self.angle = angle
        self.owner_id = owner_id
        self.vx = math.cos(angle) * PROJECTILE_SPEED
        self.vy = math.sin(angle) * PROJECTILE_SPEED

    def draw(self, screen, center_x, center_y):
        # Draw line
        start_x = center_x + self.x
        start_y = center_y + self.y
        # Simple circle for now or line
        pygame.draw.circle(screen, (255, 255, 255), (int(start_x), int(start_y)), self.radius)

class Player(Entity):
    def __init__(self, game, pid, color):
        super().__init__(0, 0, PLAYER_RADIUS)
        self.game = game
        self.pid = pid
        self.color = color
        self.hp = 10
        self.angle = 0
        self.overheat = 0
        self.is_overheated = False
        self.time_since_last_shot = 0
        
        # Mechanics
        self.acceleration_window = 0

    def update(self, dt):
        if (self.hp <= 0): return

        # Input / AI
        if self.pid == 1:
            self.handle_input(dt)
        else:
            self.update_ai(dt)

        # Acceleration Window Steering
        if self.acceleration_window > 0:
            self.acceleration_window -= dt
            speed = math.sqrt(self.vx**2 + self.vy**2)
            if speed > 0:
                target_vx = math.cos(self.angle) * speed
                target_vy = math.sin(self.angle) * speed
                steer_factor = 5.0 * dt
                self.vx += (target_vx - self.vx) * steer_factor
                self.vy += (target_vy - self.vy) * steer_factor

        super().update(dt)

        # Overheat Logic
        self.time_since_last_shot += dt
        if self.is_overheated:
            self.overheat -= dt / 3.0
            if self.overheat <= 0:
                self.overheat = 0
                self.is_overheated = False
        elif self.time_since_last_shot > 2.0 and self.overheat > 0:
            self.overheat -= 0.5 * dt
            if self.overheat < 0: self.overheat = 0

    def handle_input(self, dt):
        mx, my = pygame.mouse.get_pos()
        cx, cy = WIDTH // 2, HEIGHT // 2
        # Player pos on screen
        px = cx + self.x
        py = cy + self.y
        
        dx = mx - px
        dy = my - py
        self.angle = math.atan2(dy, dx)

        if pygame.mouse.get_pressed()[0]:
            self.shoot()

    def update_ai(self, dt):
        p1 = self.game.players[0]
        if p1.hp > 0:
            dx = p1.x - self.x
            dy = p1.y - self.y
            self.angle = math.atan2(dy, dx)
            
            if not self.is_overheated and random.random() < 0.02:
                self.shoot()

    def shoot(self):
        if self.hp <= 0 or self.is_overheated: return
        if self.game.is_sudden_death: return

        spawn_dist = self.radius + 10
        px = self.x + math.cos(self.angle) * spawn_dist
        py = self.y + math.sin(self.angle) * spawn_dist
        
        self.game.projectiles.append(Projectile(px, py, self.angle, self.pid))

        # Recoil
        self.vx -= math.cos(self.angle) * RECOIL_FORCE * 0.016 # Impulse approx? 
        # In TS we added velocity directly. Let's do same.
        # Wait, RECOIL_FORCE was 300. If we add 300 to velocity every frame, that's huge if held?
        # No, shoot is once per call.
        # But shoot is called every frame if mouse held?
        # In TS I didn't limit fire rate explicitly other than overheat.
        # Let's limit fire rate slightly or just let overheat handle it.
        # 0.15 overheat per shot -> ~7 shots.
        
        recoil_impulse = 50 # Adjusted for Python/Pygame scale feel
        self.vx -= math.cos(self.angle) * recoil_impulse
        self.vy -= math.sin(self.angle) * recoil_impulse
        
        self.acceleration_window = 0.15
        self.overheat += 0.15
        self.time_since_last_shot = 0
        if self.overheat >= 1.0:
            self.overheat = 1.0
            self.is_overheated = True

    def draw(self, screen, center_x, center_y):
        if self.hp <= 0: return
        px = int(center_x + self.x)
        py = int(center_y + self.y)
        
        # Body
        pygame.draw.circle(screen, self.color, (px, py), self.radius)
        
        # Cannon
        end_x = px + math.cos(self.angle) * self.radius
        end_y = py + math.sin(self.angle) * self.radius
        pygame.draw.line(screen, (255, 255, 255), (px, py), (end_x, end_y), 5)

class Game:
    def __init__(self):
        pygame.init()
        self.screen = pygame.display.set_mode((WIDTH, HEIGHT))
        pygame.display.set_caption("XORG - Pygame Edition")
        self.clock = pygame.time.Clock()
        self.running = True
        
        self.arena_radius = ARENA_RADIUS_BASE
        self.is_sudden_death = False
        self.match_time = 60
        
        self.players = []
        self.projectiles = []
        
        self.init_game()

    def init_game(self):
        self.players = [
            Player(self, 1, (255, 50, 50)),
            Player(self, 2, (50, 50, 255))
        ]
        self.players[0].x = -150
        self.players[1].x = 150
        self.projectiles = []
        self.match_time = 60
        self.is_sudden_death = False
        self.arena_radius = ARENA_RADIUS_BASE

    def run(self):
        while self.running:
            dt = self.clock.tick(FPS) / 1000.0
            self.handle_events()
            self.update(dt)
            self.draw()
        pygame.quit()

    def handle_events(self):
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                self.running = False

    def update(self, dt):
        # Timer
        if self.match_time > 0:
            self.match_time -= dt
            if self.match_time <= 0:
                self.is_sudden_death = True
        elif self.is_sudden_death:
            if self.arena_radius > 50:
                self.arena_radius -= 10 * dt

        # Entities
        for p in self.players: p.update(dt)
        for proj in self.projectiles: proj.update(dt)
        
        self.projectiles = [p for p in self.projectiles if not p.should_remove]
        
        self.check_collisions()
        self.check_win()

    def check_collisions(self):
        # Wall
        for p in self.players:
            dist = math.sqrt(p.x**2 + p.y**2)
            if dist + p.radius > self.arena_radius:
                if self.is_sudden_death:
                    p.hp = 0
                else:
                    nx, ny = p.x/dist, p.y/dist
                    overlap = (dist + p.radius) - self.arena_radius
                    p.x -= nx * overlap
                    p.y -= ny * overlap
                    
                    dot = p.vx * nx + p.vy * ny
                    if dot > 0:
                        p.vx -= 2 * dot * nx
                        p.vy -= 2 * dot * ny

        # Projectiles
        for proj in self.projectiles:
            dist = math.sqrt(proj.x**2 + proj.y**2)
            if dist + proj.radius >= self.arena_radius:
                proj.should_remove = True
            
            for p in self.players:
                if proj.owner_id != p.pid and p.hp > 0:
                    d = math.sqrt((p.x - proj.x)**2 + (p.y - proj.y)**2)
                    if d < p.radius + proj.radius:
                        p.hp -= 1
                        proj.should_remove = True

        # Player-Player (Elastic)
        if len(self.players) >= 2:
            p1, p2 = self.players[0], self.players[1]
            if p1.hp > 0 and p2.hp > 0:
                dx = p2.x - p1.x
                dy = p2.y - p1.y
                dist = math.sqrt(dx*dx + dy*dy)
                if dist < p1.radius + p2.radius:
                    nx, ny = dx/dist, dy/dist
                    overlap = (p1.radius + p2.radius) - dist
                    p1.x -= nx * overlap * 0.5
                    p1.y -= ny * overlap * 0.5
                    p2.x += nx * overlap * 0.5
                    p2.y += ny * overlap * 0.5
                    
                    # Elastic
                    tx, ty = -ny, nx
                    dpTan1 = p1.vx * tx + p1.vy * ty
                    dpTan2 = p2.vx * tx + p2.vy * ty
                    dpNorm1 = p1.vx * nx + p1.vy * ny
                    dpNorm2 = p2.vx * nx + p2.vy * ny
                    
                    m1, m2 = 1, 1
                    mom1 = (dpNorm1 * (m1 - m2) + 2 * m2 * dpNorm2) / (m1 + m2)
                    mom2 = (dpNorm2 * (m2 - m1) + 2 * m1 * dpNorm1) / (m1 + m2)
                    
                    p1.vx = tx * dpTan1 + nx * mom1
                    p1.vy = ty * dpTan1 + ny * mom1
                    p2.vx = tx * dpTan2 + nx * mom2
                    p2.vy = ty * dpTan2 + ny * mom2

    def check_win(self):
        alive = [p for p in self.players if p.hp > 0]
        if len(alive) <= 1:
            # Reset
            self.init_game()

    def draw(self):
        self.screen.fill((17, 17, 17))
        cx, cy = WIDTH // 2, HEIGHT // 2
        
        # Arena
        color = (255, 68, 0) if self.is_sudden_death else (255, 255, 255)
        pygame.draw.circle(self.screen, color, (cx, cy), int(self.arena_radius), 5)
        
        for p in self.players: p.draw(self.screen, cx, cy)
        for proj in self.projectiles: proj.draw(self.screen, cx, cy)
        
        # UI
        font = pygame.font.SysFont(None, 36)
        timer_text = font.render(f"{int(self.match_time)}", True, (255, 255, 255))
        self.screen.blit(timer_text, (cx - timer_text.get_width()//2, 20))

        pygame.display.flip()

if __name__ == "__main__":
    Game().run()
