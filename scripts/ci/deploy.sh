#!/bin/bash

# ============================================================================
# Gamified Learning Journal - Deployment Script
# ============================================================================
# This script helps deploy the application to GitHub and Render
# 
# Prerequisites:
#   - Git installed
#   - GitHub CLI (gh) installed (optional but recommended)
#   - GITHUB_TOKEN environment variable set (for automated repo creation)
#
# Usage:
#   chmod +x scripts/ci/deploy.sh
#   ./scripts/ci/deploy.sh
# ============================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
REPO_NAME="gamified-learning-journal"
COMMIT_MESSAGE="initial: gamified-journal"
DEFAULT_BRANCH="main"

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║       Gamified Learning Journal - Deployment Script        ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ============================================================================
# Step 1: Initialize Git Repository
# ============================================================================
echo -e "${YELLOW}[1/5]${NC} Checking Git repository..."

if [ -d ".git" ]; then
    echo -e "${GREEN}✓${NC} Git repository already initialized"
else
    echo -e "${BLUE}→${NC} Initializing Git repository..."
    git init
    git branch -M "$DEFAULT_BRANCH"
    echo -e "${GREEN}✓${NC} Git repository initialized"
fi

# ============================================================================
# Step 2: Create .gitignore if needed
# ============================================================================
echo -e "${YELLOW}[2/5]${NC} Checking .gitignore..."

if [ ! -f ".gitignore" ]; then
    echo -e "${BLUE}→${NC} Creating .gitignore..."
    cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp
.pnp.js

# Build
.next/
out/
build/
dist/

# Testing
coverage/

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.idea/
.vscode/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Vercel
.vercel

# TypeScript
*.tsbuildinfo
next-env.d.ts
EOF
    echo -e "${GREEN}✓${NC} .gitignore created"
else
    echo -e "${GREEN}✓${NC} .gitignore already exists"
fi

# ============================================================================
# Step 3: Stage and Commit
# ============================================================================
echo -e "${YELLOW}[3/5]${NC} Staging and committing files..."

git add -A

# Check if there are changes to commit
if git diff --staged --quiet; then
    echo -e "${GREEN}✓${NC} No changes to commit (already up to date)"
else
    git commit -m "$COMMIT_MESSAGE"
    echo -e "${GREEN}✓${NC} Files committed with message: '$COMMIT_MESSAGE'"
fi

# ============================================================================
# Step 4: Create GitHub Repository
# ============================================================================
echo -e "${YELLOW}[4/5]${NC} Setting up GitHub repository..."

# Check if gh CLI is available
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✓${NC} GitHub CLI (gh) detected"
    
    # Check if authenticated
    if gh auth status &> /dev/null; then
        echo -e "${BLUE}→${NC} Creating GitHub repository..."
        
        # Check if repo already exists
        if gh repo view "$REPO_NAME" &> /dev/null; then
            echo -e "${GREEN}✓${NC} Repository already exists on GitHub"
        else
            gh repo create "$REPO_NAME" --public --source=. --remote=origin --push
            echo -e "${GREEN}✓${NC} GitHub repository created and pushed"
        fi
    else
        echo -e "${YELLOW}⚠${NC} GitHub CLI not authenticated"
        echo -e "${BLUE}→${NC} Run: gh auth login"
        echo ""
        echo -e "${BLUE}Or manually create repo with:${NC}"
        echo -e "  gh repo create $REPO_NAME --public --source=. --remote=origin --push"
    fi
else
    echo -e "${YELLOW}⚠${NC} GitHub CLI (gh) not found"
    echo ""
    echo -e "${BLUE}Option 1: Install GitHub CLI${NC}"
    echo "  brew install gh  # macOS"
    echo "  sudo apt install gh  # Ubuntu/Debian"
    echo ""
    echo -e "${BLUE}Option 2: Create repository manually${NC}"
    echo "  1. Go to https://github.com/new"
    echo "  2. Create repository named: $REPO_NAME"
    echo "  3. Run these commands:"
    echo ""
    echo -e "  ${GREEN}git remote add origin https://github.com/YOUR_USERNAME/$REPO_NAME.git${NC}"
    echo -e "  ${GREEN}git push -u origin $DEFAULT_BRANCH${NC}"
    echo ""
    
    if [ -n "$GITHUB_TOKEN" ]; then
        echo -e "${BLUE}Option 3: Use curl with GITHUB_TOKEN${NC}"
        echo "  curl -H \"Authorization: token \$GITHUB_TOKEN\" \\"
        echo "       -d '{\"name\":\"$REPO_NAME\",\"private\":false}' \\"
        echo "       https://api.github.com/user/repos"
    fi
fi

# ============================================================================
# Step 5: Render Deployment Instructions
# ============================================================================
echo ""
echo -e "${YELLOW}[5/5]${NC} Render deployment setup..."

# Check if render.yaml exists
if [ -f "render.yaml" ]; then
    echo -e "${GREEN}✓${NC} render.yaml already exists"
else
    echo -e "${YELLOW}⚠${NC} render.yaml not found in project root"
    echo -e "${BLUE}→${NC} Make sure render.yaml is in the project root"
fi

echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  Render Deployment Options                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if render CLI is available
if command -v render &> /dev/null; then
    echo -e "${GREEN}✓${NC} Render CLI detected"
    echo ""
    echo -e "${BLUE}Deploy with Render CLI:${NC}"
    echo "  render blueprint launch"
    echo ""
else
    echo -e "${YELLOW}⚠${NC} Render CLI not installed"
    echo ""
    echo -e "${BLUE}Option 1: Install Render CLI${NC}"
    echo "  npm install -g @render-cli/render"
    echo "  render login"
    echo "  render blueprint launch"
    echo ""
fi

echo -e "${BLUE}Option 2: Deploy via Render Dashboard${NC}"
echo "  1. Go to https://dashboard.render.com/blueprints"
echo "  2. Click 'New Blueprint Instance'"
echo "  3. Connect your GitHub repository: $REPO_NAME"
echo "  4. Render will auto-detect render.yaml and deploy"
echo ""

echo -e "${BLUE}Option 3: Manual Web Service${NC}"
echo "  1. Go to https://dashboard.render.com/new/web"
echo "  2. Connect GitHub repo: $REPO_NAME"
echo "  3. Configure:"
echo "     - Build Command: npm install --include=dev && npm run build"
echo "     - Start Command: npm start"
echo "     - Environment: Node"
echo "  4. Add Environment Variables:"
echo "     - NODE_VERSION=20"
echo ""

echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}                    Deployment Complete!                     ${NC}"
echo -e "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo "  1. Push your code to GitHub (if not done automatically)"
echo "  2. Deploy to Render using one of the options above"
echo "  3. Visit your deployed app!"
echo ""

