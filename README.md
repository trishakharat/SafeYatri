# SafeYatri - Smart Tourist Safety Monitoring System

> **सुरक्षित यात्रा, डिजिटल भारत** - Safe Travel, Digital India

SafeYatri is a comprehensive Smart Tourist Safety Monitoring & Incident Response System that leverages AI, Blockchain, and Geo-Fencing technologies to ensure tourist safety across India.

## 🚀 Quick Start

### Docker Compose (Recommended)
```bash
# Clone repository
git clone https://github.com/safeyatri/safeyatri.git
cd safeyatri

# Start all services
docker-compose up -d

# Access the system
# Main Website: http://localhost:5000
# Dashboard: http://localhost:5000/dashboard
# API Docs: http://localhost:5000/api/docs
```

### Manual Installation
```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start server
python backend/app.py
```

## 🔐 Authentication

### Default Credentials
| Role | Username | Password | 2FA |
|------|----------|----------|-----|
| Admin | `admin` | `SafeYatri@2024` | No |
| Dispatcher | `dispatcher` | `SafeYatri@2024` | Yes |

## 🧪 Testing

```bash
# Unit tests
pytest tests/ -v

# Load testing
k6 run tests/load/load-test.js
```

## 📊 API Documentation

Full API documentation available at: http://localhost:5000/api/docs

## 🚀 Deployment

### Kubernetes
```bash
kubectl apply -f k8s/
```

### Docker
```bash
docker-compose up -d
```

## 📈 Monitoring

- **Grafana**: http://localhost:3000 (admin/admin)
- **Prometheus**: http://localhost:9090

## 🔒 Security Features

- End-to-end encryption
- Role-based access control
- Two-factor authentication
- Face blur privacy protection
- GDPR/DPDP 2023 compliance
- Comprehensive audit logging

## 📞 Support

- **Documentation**: http://localhost:5000/api/docs
- **Issues**: https://github.com/safeyatri/safeyatri/issues
- **Email**: support@safeyatri.gov.in

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**SafeYatri** - Protecting tourists, empowering authorities 🇮🇳