#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m' 
RED='\033[0;31m'
NC='\033[0m'

info() { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    error "Docker is not running. Please start Docker."
    exit 1
fi

case "${1:-help}" in
    "up"|"start")
        info "Starting services..."
        docker-compose up --build
        ;;
    "down"|"stop")
        info "Stopping services..."
        docker-compose down
        ;;
    "logs")
        docker-compose logs -f
        ;;
    "rebuild")
        info "Rebuilding and starting..."
        docker-compose down
        docker-compose up --build --force-recreate
        ;;
    "help"|*)
        echo "Usage: $0 {up|down|logs|rebuild}"
        echo "  up      - Start all services"
        echo "  down    - Stop all services"  
        echo "  logs    - View logs"
        echo "  rebuild - Force rebuild and restart"
        ;;
esac
