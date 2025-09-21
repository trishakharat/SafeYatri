"""
OpenAPI/Swagger documentation for SafeYatri API
"""
from flask import Blueprint, jsonify
import json

api_docs_bp = Blueprint('api_docs', __name__, url_prefix='/api/docs')

@api_docs_bp.route('/openapi.json')
def openapi_spec():
    """OpenAPI 3.0 specification"""
    spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "SafeYatri API",
            "description": "Smart Tourist Safety Monitoring & Incident Response System API",
            "version": "1.0.0",
            "contact": {
                "name": "SafeYatri Support",
                "email": "support@safeyatri.gov.in"
            },
            "license": {
                "name": "MIT",
                "url": "https://opensource.org/licenses/MIT"
            }
        },
        "servers": [
            {
                "url": "https://api.safeyatri.gov.in",
                "description": "Production server"
            },
            {
                "url": "http://localhost:5000",
                "description": "Development server"
            }
        ],
        "security": [
            {
                "BearerAuth": []
            }
        ],
        "paths": {
            "/api/auth/login": {
                "post": {
                    "tags": ["Authentication"],
                    "summary": "User login",
                    "description": "Authenticate user and get access token",
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "username": {
                                            "type": "string",
                                            "example": "admin"
                                        },
                                        "password": {
                                            "type": "string",
                                            "example": "SafeYatri@2024"
                                        }
                                    },
                                    "required": ["username", "password"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Login successful",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "access_token": {"type": "string"},
                                            "refresh_token": {"type": "string"},
                                            "token_type": {"type": "string", "example": "Bearer"},
                                            "expires_in": {"type": "integer", "example": 900},
                                            "user": {
                                                "type": "object",
                                                "properties": {
                                                    "user_id": {"type": "string"},
                                                    "username": {"type": "string"},
                                                    "email": {"type": "string"},
                                                    "role": {"type": "string"},
                                                    "permissions": {"type": "array", "items": {"type": "string"}}
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        },
                        "401": {
                            "description": "Invalid credentials"
                        }
                    }
                }
            },
            "/api/dashboard/stats": {
                "get": {
                    "tags": ["Dashboard"],
                    "summary": "Get dashboard statistics",
                    "description": "Get real-time dashboard statistics for authorities",
                    "security": [{"BearerAuth": []}],
                    "responses": {
                        "200": {
                            "description": "Dashboard statistics",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "active_tourists": {"type": "integer"},
                                            "active_alerts": {"type": "integer"},
                                            "iot_devices": {"type": "integer"},
                                            "recent_alerts": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "alert_id": {"type": "string"},
                                                        "tourist_id": {"type": "string"},
                                                        "alert_type": {"type": "string"},
                                                        "timestamp": {"type": "string"},
                                                        "severity": {"type": "string"}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/violence/alerts": {
                "get": {
                    "tags": ["Alerts"],
                    "summary": "Get violence alerts",
                    "description": "Get recent violence alerts with tourist information",
                    "security": [{"BearerAuth": []}],
                    "responses": {
                        "200": {
                            "description": "List of violence alerts",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "alerts": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "alert_id": {"type": "string"},
                                                        "tourist_id": {"type": "string"},
                                                        "tourist_name": {"type": "string"},
                                                        "alert_type": {"type": "string"},
                                                        "severity": {"type": "string"},
                                                        "location": {"type": "object"},
                                                        "timestamp": {"type": "string"},
                                                        "violence_types": {
                                                            "type": "array",
                                                            "items": {"type": "string"}
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/cctv/zones": {
                "get": {
                    "tags": ["CCTV"],
                    "summary": "Get CCTV monitoring zones",
                    "description": "Get all CCTV monitoring zones with statistics",
                    "security": [{"BearerAuth": []}],
                    "responses": {
                        "200": {
                            "description": "CCTV zones information",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "zones": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "zone_id": {"type": "string"},
                                                        "name": {"type": "string"},
                                                        "location": {
                                                            "type": "object",
                                                            "properties": {
                                                                "latitude": {"type": "number"},
                                                                "longitude": {"type": "number"}
                                                            }
                                                        },
                                                        "status": {"type": "string"},
                                                        "tourist_count": {"type": "integer"},
                                                        "risk_level": {"type": "string"}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/workflow/dispatcher-inbox": {
                "get": {
                    "tags": ["Workflow"],
                    "summary": "Get dispatcher inbox",
                    "description": "Get alerts assigned to dispatcher for review",
                    "security": [{"BearerAuth": []}],
                    "responses": {
                        "200": {
                            "description": "Dispatcher inbox alerts",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "alerts": {
                                                "type": "array",
                                                "items": {
                                                    "type": "object",
                                                    "properties": {
                                                        "alert_id": {"type": "string"},
                                                        "tourist_id": {"type": "string"},
                                                        "alert_type": {"type": "string"},
                                                        "priority": {"type": "string"},
                                                        "status": {"type": "string"},
                                                        "location": {"type": "object"},
                                                        "evidence_path": {"type": "string"},
                                                        "created_at": {"type": "string"},
                                                        "time_remaining": {"type": "integer"}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            },
            "/api/workflow/alert/{alert_id}/review": {
                "post": {
                    "tags": ["Workflow"],
                    "summary": "Review alert",
                    "description": "Review alert and make dispatch decision",
                    "security": [{"BearerAuth": []}],
                    "parameters": [
                        {
                            "name": "alert_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                            "description": "Alert ID to review"
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "confidence_score": {
                                            "type": "number",
                                            "minimum": 0,
                                            "maximum": 1,
                                            "description": "Confidence score (0-1)"
                                        },
                                        "decision": {
                                            "type": "string",
                                            "enum": ["confirmed", "rejected", "escalated"],
                                            "description": "Dispatch decision"
                                        },
                                        "notes": {
                                            "type": "string",
                                            "description": "Review notes"
                                        }
                                    },
                                    "required": ["decision"]
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Alert reviewed successfully"
                        },
                        "400": {
                            "description": "Invalid request data"
                        },
                        "404": {
                            "description": "Alert not found"
                        }
                    }
                }
            },
            "/api/privacy/consent/{tourist_id}": {
                "get": {
                    "tags": ["Privacy"],
                    "summary": "Get tourist consent",
                    "description": "Get consent status for tourist",
                    "security": [{"BearerAuth": []}],
                    "parameters": [
                        {
                            "name": "tourist_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                            "description": "Tourist ID"
                        }
                    ],
                    "responses": {
                        "200": {
                            "description": "Consent information",
                            "content": {
                                "application/json": {
                                    "schema": {
                                        "type": "object",
                                        "properties": {
                                            "tourist_id": {"type": "string"},
                                            "consent_types": {
                                                "type": "object",
                                                "additionalProperties": {
                                                    "type": "object",
                                                    "properties": {
                                                        "description": {"type": "string"},
                                                        "required": {"type": "boolean"},
                                                        "current_status": {"type": "boolean"}
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                },
                "post": {
                    "tags": ["Privacy"],
                    "summary": "Update tourist consent",
                    "description": "Update consent preferences for tourist",
                    "security": [{"BearerAuth": []}],
                    "parameters": [
                        {
                            "name": "tourist_id",
                            "in": "path",
                            "required": True,
                            "schema": {"type": "string"},
                            "description": "Tourist ID"
                        }
                    ],
                    "requestBody": {
                        "required": True,
                        "content": {
                            "application/json": {
                                "schema": {
                                    "type": "object",
                                    "properties": {
                                        "face_matching": {"type": "boolean"},
                                        "location_tracking": {"type": "boolean"},
                                        "data_retention": {"type": "boolean"},
                                        "emergency_contact": {"type": "boolean"},
                                        "analytics": {"type": "boolean"}
                                    }
                                }
                            }
                        }
                    },
                    "responses": {
                        "200": {
                            "description": "Consent updated successfully"
                        }
                    }
                }
            }
        },
        "components": {
            "securitySchemes": {
                "BearerAuth": {
                    "type": "http",
                    "scheme": "bearer",
                    "bearerFormat": "JWT"
                }
            },
            "schemas": {
                "Error": {
                    "type": "object",
                    "properties": {
                        "error": {"type": "string"},
                        "message": {"type": "string"}
                    }
                },
                "User": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string"},
                        "username": {"type": "string"},
                        "email": {"type": "string"},
                        "role": {"type": "string"},
                        "permissions": {
                            "type": "array",
                            "items": {"type": "string"}
                        }
                    }
                },
                "Alert": {
                    "type": "object",
                    "properties": {
                        "alert_id": {"type": "string"},
                        "tourist_id": {"type": "string"},
                        "alert_type": {"type": "string"},
                        "priority": {"type": "string"},
                        "status": {"type": "string"},
                        "location": {"type": "object"},
                        "timestamp": {"type": "string"},
                        "evidence_path": {"type": "string"}
                    }
                }
            }
        }
    }
    
    return jsonify(spec)

@api_docs_bp.route('/')
def swagger_ui():
    """Swagger UI interface"""
    return '''
    <!DOCTYPE html>
    <html>
    <head>
        <title>SafeYatri API Documentation</title>
        <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui.css" />
        <style>
            html { box-sizing: border-box; overflow: -moz-scrollbars-vertical; overflow-y: scroll; }
            *, *:before, *:after { box-sizing: inherit; }
            body { margin:0; background: #fafafa; }
        </style>
    </head>
    <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-bundle.js"></script>
        <script src="https://unpkg.com/swagger-ui-dist@4.15.5/swagger-ui-standalone-preset.js"></script>
        <script>
            window.onload = function() {
                SwaggerUIBundle({
                    url: '/api/docs/openapi.json',
                    dom_id: '#swagger-ui',
                    presets: [
                        SwaggerUIBundle.presets.apis,
                        SwaggerUIStandalonePreset
                    ],
                    layout: "StandaloneLayout",
                    deepLinking: true,
                    showExtensions: true,
                    showCommonExtensions: true
                });
            };
        </script>
    </body>
    </html>
    '''
