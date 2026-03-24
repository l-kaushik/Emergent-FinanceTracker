#!/bin/bash
echo "Testing Docker setup..."
echo ""

# Test 1: Check Dockerfile syntax
echo "✓ Checking Dockerfile..."
docker build -t finance-tracker-test -f Dockerfile --target frontend-builder . > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "  ✓ Dockerfile syntax is valid"
else
    echo "  ✗ Dockerfile has issues"
fi

# Test 2: Check docker-compose syntax
echo "✓ Checking docker-compose.yml..."
docker-compose config > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "  ✓ docker-compose.yml is valid"
else
    echo "  ✗ docker-compose.yml has issues"
fi

# Test 3: Check required files
echo "✓ Checking required files..."
files=(".dockerignore" "Dockerfile" "docker-compose.yml" ".env.example" "README.docker.md")
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "  ✓ $file exists"
    else
        echo "  ✗ $file missing"
    fi
done

echo ""
echo "Docker setup validation complete!"
