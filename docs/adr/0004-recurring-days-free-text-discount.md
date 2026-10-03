# Deals recur by day of week; discounts are free text

A deal's validity is a non-empty set of days of the week (`Mon`–`Sun`), with no start or end dates, and its discount is free text rather than a structured amount or percentage. Discounts share no common shape ("2-for-1", "50% off mains", "free drink with burger"), so structuring them would force a lossy model; days are the intended discovery axis instead. The cost: deals can't be sorted or filtered by value, and expired deals must be removed by hand.
