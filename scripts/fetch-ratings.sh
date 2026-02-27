#!/usr/bin/env bash
# Fetches Airbnb ratings and review counts for Wetland Heights listings.
# Usage: ./scripts/fetch-ratings.sh
#
# Requires: curl, grep
# Note: Airbnb may rate-limit or block requests if run too frequently.

LISTINGS=(
    "Nugegoda Residence · 1 BR|https://airbnb.com/h/nugegoda-king-room"
    "Nugegoda Residence · 2 BR|https://airbnb.com/h/nugegoda-residence"
)

UA="Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"

printf "\n%-30s  %-6s  %s\n" "Property" "Rating" "Reviews"
printf "%-30s  %-6s  %s\n" "------------------------------" "------" "-------"

for entry in "${LISTINGS[@]}"; do
    name="${entry%%|*}"
    url="${entry##*|}"

    html=$(curl -s -L -A "$UA" "$url" 2>/dev/null || true)

    rating=$(echo "$html" | grep -o '"ratingValue":[0-9.]*' | head -1 | cut -d: -f2 || true)
    reviews=$(echo "$html" | grep -o '"reviewCount":[0-9]*' | head -1 | cut -d: -f2 || true)

    rating="${rating:-N/A}"
    reviews="${reviews:-N/A}"

    if [ "$rating" = "0" ] || [ "$reviews" = "0" ] || [ "$rating" = "N/A" ]; then
        printf "%-30s  %-6s  %s\n" "$name" "—" "New listing"
    else
        printf "%-30s  %-6s  %s\n" "$name" "$rating" "$reviews reviews"
    fi
done

printf "\nFetched: %s\n\n" "$(date '+%Y-%m-%d %H:%M')"
