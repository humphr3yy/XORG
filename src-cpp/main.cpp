#include <SDL2/SDL.h>
#include <vector>
#include <cmath>
#include <algorithm>
#include <iostream>

// Constants
const int WIDTH = 800;
const int HEIGHT = 600;
const float PI = 3.14159265359f;
const float ARENA_RADIUS_BASE = 250.0f;
const float PLAYER_RADIUS = 20.0f;
const float PROJECTILE_RADIUS = 5.0f;
const float PROJECTILE_SPEED = 800.0f;
const float RECOIL_FORCE = 300.0f; // Impulse magnitude?
// In TS we added velocity directly. In Pygame we used 50.
// Let's try 150 for C++ to balance delta time.

struct Vector2 {
    float x, y;
};

struct Entity {
    Vector2 pos;
    Vector2 vel;
    float radius;
    bool shouldRemove = false;
};

struct Projectile : public Entity {
    int ownerId;
    float angle;
};

struct Player : public Entity {
    int id;
    float angle; // Facing angle
    float hp;
    float overheat;
    bool isOverheated;
    float timeSinceLastShot;
    float accelerationWindow;
    
    // Color
    Uint8 r, g, b;
};

// Helper for drawing circles
void fillCircle(SDL_Renderer* renderer, int cx, int cy, int radius) {
    for (int w = 0; w < radius * 2; w++) {
        for (int h = 0; h < radius * 2; h++) {
            int dx = radius - w; // horizontal offset
            int dy = radius - h; // vertical offset
            if ((dx*dx + dy*dy) <= (radius * radius)) {
                SDL_RenderDrawPoint(renderer, cx + dx, cy + dy);
            }
        }
    }
}

class Game {
public:
    SDL_Window* window;
    SDL_Renderer* renderer;
    bool running;
    Uint32 lastTime;
    
    float arenaRadius;
    bool isSuddenDeath;
    float matchTime;
    
    std::vector<Player> players;
    std::vector<Projectile> projectiles;

    Game() {
        SDL_Init(SDL_INIT_VIDEO);
        window = SDL_CreateWindow("XORG - Native", SDL_WINDOWPOS_CENTERED, SDL_WINDOWPOS_CENTERED, WIDTH, HEIGHT, SDL_WINDOW_SHOWN);
        renderer = SDL_CreateRenderer(window, -1, SDL_RENDERER_ACCELERATED | SDL_RENDERER_PRESENTVSYNC);
        running = true;
        lastTime = SDL_GetTicks();
        
        initGame();
    }
    
    ~Game() {
        SDL_DestroyRenderer(renderer);
        SDL_DestroyWindow(window);
        SDL_Quit();
    }
    
    void initGame() {
        players.clear();
        projectiles.clear();
        
        Player p1;
        p1.id = 1;
        p1.pos = {-150, 0};
        p1.vel = {0, 0};
        p1.radius = PLAYER_RADIUS;
        p1.hp = 10;
        p1.angle = 0;
        p1.overheat = 0;
        p1.isOverheated = false;
        p1.timeSinceLastShot = 0;
        p1.accelerationWindow = 0;
        p1.r = 255; p1.g = 50; p1.b = 50;
        players.push_back(p1);
        
        Player p2;
        p2.id = 2;
        p2.pos = {150, 0};
        p2.vel = {0, 0};
        p2.radius = PLAYER_RADIUS;
        p2.hp = 10;
        p2.angle = PI;
        p2.overheat = 0;
        p2.isOverheated = false;
        p2.timeSinceLastShot = 0;
        p2.accelerationWindow = 0;
        p2.r = 50; p2.g = 50; p2.b = 255;
        players.push_back(p2);
        
        arenaRadius = ARENA_RADIUS_BASE;
        isSuddenDeath = false;
        matchTime = 60.0f;
    }
    
    void run() {
        while (running) {
            Uint32 currentTime = SDL_GetTicks();
            float dt = (currentTime - lastTime) / 1000.0f;
            lastTime = currentTime;
            
            handleEvents();
            update(dt);
            draw();
        }
    }
    
    void handleEvents() {
        SDL_Event e;
        while (SDL_PollEvent(&e)) {
            if (e.type == SDL_QUIT) {
                running = false;
            }
            if (e.type == SDL_MOUSEBUTTONDOWN && e.button.button == SDL_BUTTON_LEFT) {
                shoot(players[0]);
            }
        }
        
        // Mouse Aim for P1
        int mx, my;
        SDL_GetMouseState(&mx, &my);
        float cx = WIDTH / 2.0f;
        float cy = HEIGHT / 2.0f;
        float px = cx + players[0].pos.x;
        float py = cy + players[0].pos.y;
        players[0].angle = atan2(my - py, mx - px);
    }
    
    void shoot(Player& p) {
        if (p.hp <= 0 || p.isOverheated || isSuddenDeath) return;
        
        float spawnDist = p.radius + 10;
        float px = p.pos.x + cos(p.angle) * spawnDist;
        float py = p.pos.y + sin(p.angle) * spawnDist;
        
        Projectile proj;
        proj.pos = {px, py};
        proj.angle = p.angle;
        proj.ownerId = p.id;
        proj.radius = PROJECTILE_RADIUS;
        proj.vel = {cos(p.angle) * PROJECTILE_SPEED, sin(p.angle) * PROJECTILE_SPEED};
        projectiles.push_back(proj);
        
        // Recoil - Pure velocity addition for pong-like movement
        float impulse = 200.0f; 
        p.vel.x -= cos(p.angle) * impulse;
        p.vel.y -= sin(p.angle) * impulse;
        
        // Overheat - Reduced increment for "way more shots"
        p.overheat += 0.05f; 
        p.timeSinceLastShot = 0;
        if (p.overheat >= 1.0f) {
            p.overheat = 1.0f;
            p.isOverheated = true;
        }
    }
    
    void update(float dt) {
        // Timer
        if (matchTime > 0) {
            matchTime -= dt;
            if (matchTime <= 0) isSuddenDeath = true;
        } else if (isSuddenDeath) {
            if (arenaRadius > 50) arenaRadius -= 10 * dt;
        }
        
        // Players
        for (auto& p : players) {
            if (p.hp <= 0) continue;
            
            // AI for P2
            if (p.id == 2) {
                // Aim at P1
                float dx = players[0].pos.x - p.pos.x;
                float dy = players[0].pos.y - p.pos.y;
                p.angle = atan2(dy, dx);
                
                if (!p.isOverheated && (rand() % 100) < 2) {
                    shoot(p);
                }
            }
            
            // Movement - No friction, just pure velocity
            p.pos.x += p.vel.x * dt;
            p.pos.y += p.vel.y * dt;
            
            // Overheat
            p.timeSinceLastShot += dt;
            if (p.isOverheated) {
                p.overheat -= dt / 3.0f;
                if (p.overheat <= 0) {
                    p.overheat = 0;
                    p.isOverheated = false;
                }
            } else if (p.timeSinceLastShot > 2.0f && p.overheat > 0) {
                p.overheat -= 0.5f * dt;
                if (p.overheat < 0) p.overheat = 0;
            }
        }
        
        // Projectiles
        for (auto& proj : projectiles) {
            proj.pos.x += proj.vel.x * dt;
            proj.pos.y += proj.vel.y * dt;
            
            float dist = sqrt(proj.pos.x*proj.pos.x + proj.pos.y*proj.pos.y);
            if (dist + proj.radius >= arenaRadius) {
                proj.shouldRemove = true;
            }
        }
        
        checkCollisions();
        
        // Remove projectiles
        projectiles.erase(std::remove_if(projectiles.begin(), projectiles.end(), 
            [](const Projectile& p){ return p.shouldRemove; }), projectiles.end());
            
        // Check Win
        int alive = 0;
        for (const auto& p : players) if (p.hp > 0) alive++;
        if (alive <= 1) initGame();
    }
    
    void checkCollisions() {
        // Wall - Elastic Bounce
        for (auto& p : players) {
            float dist = sqrt(p.pos.x*p.pos.x + p.pos.y*p.pos.y);
            if (dist + p.radius > arenaRadius) {
                if (isSuddenDeath) {
                    p.hp = 0;
                } else {
                    float nx = p.pos.x / dist;
                    float ny = p.pos.y / dist;
                    float overlap = (dist + p.radius) - arenaRadius;
                    
                    // Push back
                    p.pos.x -= nx * overlap;
                    p.pos.y -= ny * overlap;
                    
                    // Reflect velocity: V_new = V_old - 2 * (V_old . N) * N
                    float dot = p.vel.x * nx + p.vel.y * ny;
                    if (dot > 0) {
                        p.vel.x -= 2 * dot * nx;
                        p.vel.y -= 2 * dot * ny;
                    }
                }
            }
        }
        
        // Projectiles vs Players
        for (auto& proj : projectiles) {
            for (auto& p : players) {
                if (proj.ownerId != p.id && p.hp > 0) {
                    float dx = p.pos.x - proj.pos.x;
                    float dy = p.pos.y - proj.pos.y;
                    float d = sqrt(dx*dx + dy*dy);
                    if (d < p.radius + proj.radius) {
                        p.hp -= 1;
                        proj.shouldRemove = true;
                    }
                }
            }
        }
        
        // Player vs Player
        if (players.size() >= 2) {
            Player& p1 = players[0];
            Player& p2 = players[1];
            if (p1.hp > 0 && p2.hp > 0) {
                float dx = p2.pos.x - p1.pos.x;
                float dy = p2.pos.y - p1.pos.y;
                float dist = sqrt(dx*dx + dy*dy);
                if (dist < p1.radius + p2.radius) {
                    float nx = dx / dist;
                    float ny = dy / dist;
                    float overlap = (p1.radius + p2.radius) - dist;
                    p1.pos.x -= nx * overlap * 0.5f;
                    p1.pos.y -= ny * overlap * 0.5f;
                    p2.pos.x += nx * overlap * 0.5f;
                    p2.pos.y += ny * overlap * 0.5f;
                    
                    // Elastic
                    float tx = -ny;
                    float ty = nx;
                    float dpTan1 = p1.vel.x * tx + p1.vel.y * ty;
                    float dpTan2 = p2.vel.x * tx + p2.vel.y * ty;
                    float dpNorm1 = p1.vel.x * nx + p1.vel.y * ny;
                    float dpNorm2 = p2.vel.x * nx + p2.vel.y * ny;
                    
                    float m1 = 1.0f, m2 = 1.0f;
                    float mom1 = (dpNorm1 * (m1 - m2) + 2 * m2 * dpNorm2) / (m1 + m2);
                    float mom2 = (dpNorm2 * (m2 - m1) + 2 * m1 * dpNorm1) / (m1 + m2);
                    
                    p1.vel.x = tx * dpTan1 + nx * mom1;
                    p1.vel.y = ty * dpTan1 + ny * mom1;
                    p2.vel.x = tx * dpTan2 + nx * mom2;
                    p2.vel.y = ty * dpTan2 + ny * mom2;
                }
            }
        }
    }
    
    void draw() {
        SDL_SetRenderDrawColor(renderer, 17, 17, 17, 255);
        SDL_RenderClear(renderer);
        
        float cx = WIDTH / 2.0f;
        float cy = HEIGHT / 2.0f;
        
        // Arena
        if (isSuddenDeath) SDL_SetRenderDrawColor(renderer, 255, 68, 0, 255);
        else SDL_SetRenderDrawColor(renderer, 255, 255, 255, 255);
        
        // Draw Circle (Simple approximation)
        for (int i = 0; i < 360; i++) {
            float rad = i * PI / 180.0f;
            float x1 = cx + cos(rad) * arenaRadius;
            float y1 = cy + sin(rad) * arenaRadius;
            float rad2 = (i + 1) * PI / 180.0f;
            float x2 = cx + cos(rad2) * arenaRadius;
            float y2 = cy + sin(rad2) * arenaRadius;
            SDL_RenderDrawLine(renderer, x1, y1, x2, y2);
        }
        
        // Players
        for (const auto& p : players) {
            if (p.hp <= 0) continue;
            SDL_SetRenderDrawColor(renderer, p.r, p.g, p.b, 255);
            
            // Draw filled circle
            fillCircle(renderer, (int)(cx + p.pos.x), (int)(cy + p.pos.y), (int)p.radius);
            
            // Cannon (Rectangular shape)
            SDL_SetRenderDrawColor(renderer, 200, 200, 200, 255);
            float cannonLen = 30.0f;
            float cannonWidth = 10.0f;
            
            // Calculate 4 corners of rotated rect
            float dx = cos(p.angle);
            float dy = sin(p.angle);
            float nx = -dy; // normal
            float ny = dx;
            
            // Base center
            float bx = cx + p.pos.x + dx * p.radius * 0.5f;
            float by = cy + p.pos.y + dy * p.radius * 0.5f;
            
            // Tip center
            float tx = bx + dx * cannonLen;
            float ty = by + dy * cannonLen;
            
            SDL_Point points[5];
            points[0] = {(int)(bx + nx * cannonWidth/2), (int)(by + ny * cannonWidth/2)};
            points[1] = {(int)(tx + nx * cannonWidth/2), (int)(ty + ny * cannonWidth/2)};
            points[2] = {(int)(tx - nx * cannonWidth/2), (int)(ty - ny * cannonWidth/2)};
            points[3] = {(int)(bx - nx * cannonWidth/2), (int)(by - ny * cannonWidth/2)};
            points[4] = points[0]; // Close loop
            
            SDL_RenderDrawLines(renderer, points, 5);
        }
        
        // Projectiles
        SDL_SetRenderDrawColor(renderer, 255, 255, 255, 255);
        for (const auto& proj : projectiles) {
            SDL_Rect rect = {(int)(cx + proj.pos.x - 2), (int)(cy + proj.pos.y - 2), 4, 4};
            SDL_RenderFillRect(renderer, &rect);
        }
        
        // Vertical Health Bars
        int barWidth = 20;
        int barHeight = 400;
        int barY = (HEIGHT - barHeight) / 2;
        
        // P1 (Left)
        if (players.size() > 0) {
            SDL_SetRenderDrawColor(renderer, 50, 50, 50, 255);
            SDL_Rect bg = {20, barY, barWidth, barHeight};
            SDL_RenderFillRect(renderer, &bg);
            
            float hpPct = players[0].hp / 10.0f;
            if (hpPct < 0) hpPct = 0;
            int fillH = (int)(barHeight * hpPct);
            SDL_SetRenderDrawColor(renderer, players[0].r, players[0].g, players[0].b, 255);
            SDL_Rect fg = {20, barY + (barHeight - fillH), barWidth, fillH};
            SDL_RenderFillRect(renderer, &fg);
        }
        
        // P2 (Right)
        if (players.size() > 1) {
            SDL_SetRenderDrawColor(renderer, 50, 50, 50, 255);
            SDL_Rect bg = {WIDTH - 20 - barWidth, barY, barWidth, barHeight};
            SDL_RenderFillRect(renderer, &bg);
            
            float hpPct = players[1].hp / 10.0f;
            if (hpPct < 0) hpPct = 0;
            int fillH = (int)(barHeight * hpPct);
            SDL_SetRenderDrawColor(renderer, players[1].r, players[1].g, players[1].b, 255);
            SDL_Rect fg = {WIDTH - 20 - barWidth, barY + (barHeight - fillH), barWidth, fillH};
            SDL_RenderFillRect(renderer, &fg);
        }

        SDL_RenderPresent(renderer);
    }
};

int main(int argc, char* argv[]) {
    Game game;
    game.run();
    return 0;
}
