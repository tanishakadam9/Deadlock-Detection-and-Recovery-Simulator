from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import UniqueConstraint

db = SQLAlchemy()

class Process(db.Model):
    __tablename__ = 'process'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    priority = db.Column(db.String(20), default='Medium', nullable=False)

    allocations = db.relationship('Allocation', back_populates='process', cascade='all, delete-orphan')
    requests = db.relationship('Request', back_populates='process', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'priority': self.priority
        }

class ResourceType(db.Model):
    __tablename__ = 'resource_type'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    instances = db.Column(db.Integer, default=1, nullable=False)

    allocations = db.relationship('Allocation', back_populates='resource', cascade='all, delete-orphan')
    requests = db.relationship('Request', back_populates='resource', cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'instances': self.instances
        }

class Allocation(db.Model):
    __tablename__ = 'allocation'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    process_id = db.Column(db.Integer, db.ForeignKey('process.id'), nullable=False)
    resource_id = db.Column(db.Integer, db.ForeignKey('resource_type.id'), nullable=False)
    amount = db.Column(db.Integer, default=1, nullable=False)

    __table_args__ = (UniqueConstraint('process_id', 'resource_id', name='uq_allocation_process_resource'),)

    process = db.relationship('Process', back_populates='allocations')
    resource = db.relationship('ResourceType', back_populates='allocations')

    def to_dict(self):
        return {
            'id': self.id,
            'process_id': self.process_id,
            'resource_id': self.resource_id,
            'amount': self.amount,
            'process_name': self.process.name if self.process else None,
            'resource_name': self.resource.name if self.resource else None
        }

class Request(db.Model):
    __tablename__ = 'request'
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    process_id = db.Column(db.Integer, db.ForeignKey('process.id'), nullable=False)
    resource_id = db.Column(db.Integer, db.ForeignKey('resource_type.id'), nullable=False)
    amount = db.Column(db.Integer, default=1, nullable=False)

    __table_args__ = (UniqueConstraint('process_id', 'resource_id', name='uq_request_process_resource'),)

    process = db.relationship('Process', back_populates='requests')
    resource = db.relationship('ResourceType', back_populates='requests')

    def to_dict(self):
        return {
            'id': self.id,
            'process_id': self.process_id,
            'resource_id': self.resource_id,
            'amount': self.amount,
            'process_name': self.process.name if self.process else None,
            'resource_name': self.resource.name if self.resource else None
        }
