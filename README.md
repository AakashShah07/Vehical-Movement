🚗 Car Tracking on Map – Real-Time Visualization Project
👨‍💻 Developed by: Aakash Shah


📌 Overview
This project is a real-time car tracking and visualization system using Leaflet.js on a map interface. It simulates a vehicle's movement along a pre-defined path with directional adjustments and live marker rotation to match the heading of the vehicle.





 How to Run Locally:

```bash
git clone https://github.com/yourusername/car-tracker-map.git
cd car-tracker-map
npm install
npm run dev

```
⚙️ How It Works
Initial Setup:
The map is initialized using Leaflet with a center at the car's starting location.

Path Coordinates:
A series of Lat-Long points define the path for the car to follow.

Custom Car Icon:
A Flaticon car image is used as a marker with dynamic rotation (rotate transformation) based on the heading angle between two consecutive points.

Head-Based Movement:
The car marker moves by shifting the top/front (head), not from the center. Rotation is calculated using:
