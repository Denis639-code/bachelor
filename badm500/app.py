from flask import Flask, request, jsonify,send_from_directory
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
import os
import json
app = Flask(__name__,static_folder="")
CORS(app)
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')  # fra docker-compose
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

@app.route('/flowerInsect', methods=['GET'])
def method():
    stages = [
    { 
        "name": "Target Objects",
        "l_category": "Flowers",
        "r_category": "Insects",
        "items": [
            { "name": "Rose", "img": "/test.png" },
            { "name": "Tulip", "img": "/catTest.png" },
            { "name": "Bee", "img": "/empty.png" }
        ],
        "l_items": ["Rose", "Tulip"],
        "r_items": ["Bee"]
    },
    { 
        "name": "Feelings",
        "l_category": "Good",
        "r_category": "Bad",
        "items": [
            { "name": "Happy" },
            { "name": "Joy" },
            { "name": "Bad" }
        ],
        "l_items": ["Happy", "Joy"],
        "r_items": ["Bad"]
    },
    { 
        "name": "Combined 1",
        "l_category": "Flowers + Good",
        "r_category": "Insects + Bad",
        "items": [
            { "name": "Rose", "img": "/test.png" },
            { "name": "Tulip", "img": "/catTest.png" },
            { "name": "Bee", "img": "/empty.png" },
            { "name": "Happy" },
            { "name": "Bad" }
        ],
        "l_items": ["Rose", "Tulip", "Happy"],
        "r_items": ["Bee", "Bad"]
    },
    { 
        "name": "Final Stage",
        "l_category": "Flowers + Bad",
        "r_category": "Insects + Good",
        "items": [
            { "name": "Rose", "img": "/test.png" },
            { "name": "Tulip", "img": "/catTest.png" },
            { "name": "Bee", "img": "/empty.png" },
            { "name": "Happy" },
            { "name": "Bad" }
        ],
        "l_items": ["Rose", "Tulip", "Bad"],
        "r_items": ["Bee", "Happy"]
    }
]
    return jsonify(stages)
    

@app.route('/')
def index():
    return send_from_directory('', 'index.html')


# det er base tabellens indhold
class IATResult(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    stage = db.Column(db.String(50))
    item = db.Column(db.String(50))
    side = db.Column(db.String(10))
    time = db.Column(db.Float)

with app.app_context():
    db.create_all()

# Endpoint til at gemme resultater
@app.route('/save_results', methods=['POST'])
def save_results():
    data = request.json

    for r in data:
        db.session.add(IATResult(
            stage=r['stage'],
            item=r['item'],
            side=r['side'],
            time=r['time']
        ))

    db.session.commit()

    return jsonify({"status": "ok"}),200
    
    
    