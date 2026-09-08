import os
from flask import Flask, jsonify, request
from flask_cors import CORS
from models import db, Process, ResourceType, Allocation, Request
from sqlalchemy.exc import IntegrityError

app = Flask(__name__)
CORS(app)

# Database Configuration
basedir = os.path.abspath(os.path.dirname(__file__))
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(basedir, 'database.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

with app.app_context():
    db.create_all()

# Error Handlers
@app.errorhandler(404)
def not_found_error(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# API Routes

@app.route('/api/processes', methods=['GET'])
def get_processes():
    processes = Process.query.all()
    return jsonify([p.to_dict() for p in processes]), 200

@app.route('/api/processes', methods=['POST'])
def create_process():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    try:
        new_process = Process(name=data['name'], priority=data.get('priority', 'Medium'))
        db.session.add(new_process)
        db.session.commit()
        return jsonify(new_process.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Process name already exists'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/processes/<int:id>', methods=['DELETE'])
def delete_process(id):
    process = Process.query.get(id)
    if not process:
        return jsonify({'error': 'Process not found'}), 404
    
    try:
        db.session.delete(process)
        db.session.commit()
        return jsonify({'message': 'Process deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/resources', methods=['GET'])
def get_resources():
    resources = ResourceType.query.all()
    return jsonify([r.to_dict() for r in resources]), 200

@app.route('/api/resources', methods=['POST'])
def create_resource():
    data = request.get_json()
    if not data or not data.get('name'):
        return jsonify({'error': 'Name is required'}), 400
    
    instances = data.get('instances', 1)
    if not isinstance(instances, int) or instances < 1:
        return jsonify({'error': 'Instances must be an integer >= 1'}), 400
    
    try:
        new_resource = ResourceType(name=data['name'], instances=instances)
        db.session.add(new_resource)
        db.session.commit()
        return jsonify(new_resource.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Resource name already exists'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/resources/<int:id>', methods=['DELETE'])
def delete_resource(id):
    resource = ResourceType.query.get(id)
    if not resource:
        return jsonify({'error': 'Resource not found'}), 404
    
    try:
        db.session.delete(resource)
        db.session.commit()
        return jsonify({'message': 'Resource deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/allocations', methods=['GET'])
def get_allocations():
    allocations = Allocation.query.all()
    return jsonify([a.to_dict() for a in allocations]), 200

@app.route('/api/allocations', methods=['POST'])
def create_allocation():
    data = request.get_json()
    if not data or not data.get('process_id') or not data.get('resource_id'):
        return jsonify({'error': 'process_id and resource_id are required'}), 400
    
    process_id = data['process_id']
    resource_id = data['resource_id']
    amount = data.get('amount', 1)

    process = Process.query.get(process_id)
    resource = ResourceType.query.get(resource_id)
    
    if not process or not resource:
        return jsonify({'error': 'Process or Resource not found'}), 404
    
    # Check total allocated amount for this resource
    current_allocations = sum(a.amount for a in resource.allocations)
    if current_allocations + amount > resource.instances:
        return jsonify({'error': 'Allocation exceeds available instances'}), 400

    try:
        new_allocation = Allocation(process_id=process_id, resource_id=resource_id, amount=amount)
        db.session.add(new_allocation)
        db.session.commit()
        return jsonify(new_allocation.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Duplicate allocation for this process and resource'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/allocations/<int:id>', methods=['DELETE'])
def delete_allocation(id):
    allocation = Allocation.query.get(id)
    if not allocation:
        return jsonify({'error': 'Allocation not found'}), 404
    
    try:
        db.session.delete(allocation)
        db.session.commit()
        return jsonify({'message': 'Allocation deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/requests', methods=['GET'])
def get_requests():
    requests = Request.query.all()
    return jsonify([r.to_dict() for r in requests]), 200

@app.route('/api/requests', methods=['POST'])
def create_request():
    data = request.get_json()
    if not data or not data.get('process_id') or not data.get('resource_id'):
        return jsonify({'error': 'process_id and resource_id are required'}), 400
    
    process_id = data['process_id']
    resource_id = data['resource_id']
    amount = data.get('amount', 1)

    process = Process.query.get(process_id)
    resource = ResourceType.query.get(resource_id)
    
    if not process or not resource:
        return jsonify({'error': 'Process or Resource not found'}), 404
    
    try:
        new_request = Request(process_id=process_id, resource_id=resource_id, amount=amount)
        db.session.add(new_request)
        db.session.commit()
        return jsonify(new_request.to_dict()), 201
    except IntegrityError:
        db.session.rollback()
        return jsonify({'error': 'Duplicate request for this process and resource'}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/requests/<int:id>', methods=['DELETE'])
def delete_request(id):
    req = Request.query.get(id)
    if not req:
        return jsonify({'error': 'Request not found'}), 404
    
    try:
        db.session.delete(req)
        db.session.commit()
        return jsonify({'message': 'Request deleted successfully'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@app.route('/api/state', methods=['GET'])
def get_system_state():
    processes = Process.query.all()
    resources = ResourceType.query.all()
    allocations = Allocation.query.all()
    requests = Request.query.all()
    
    return jsonify({
        'processes': [p.to_dict() for p in processes],
        'resources': [r.to_dict() for r in resources],
        'allocations': [a.to_dict() for a in allocations],
        'requests': [req.to_dict() for req in requests]
    }), 200

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok'}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
