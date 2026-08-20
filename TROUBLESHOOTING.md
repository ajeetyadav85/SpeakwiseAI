# SpeakWise AI — Production Troubleshooting Guide

This guide covers diagnostic procedures, error codes, and resolution steps for common operational issues.

---

## 1. Diagnostic Health Check Procedures

### Check Backend Service Health
```bash
curl http://localhost:5000/health
```
Expected Output:
```json
{ "status": "UP", "service": "SpeakWise AI Engine", "timestamp": "2026-08-03T12:00:00.000Z" }
```

### Check WebSocket Connection Status
Open browser developer tools -> Network tab -> WS filter. Verify Socket.IO handshake returns HTTP 101 Switching Protocols.

---

## 2. Common Issues & Solutions

### Issue A: WebSocket Connection Failed (`ERR_CONNECTION_REFUSED`)
- **Cause**: Nginx reverse proxy missing WebSocket headers or backend Socket.IO origin mismatch.
- **Solution**: Ensure `CORS_ORIGIN` in `server/.env` matches client domain (`http://localhost:3000` or production domain) and `proxy_set_header Upgrade $http_upgrade` is enabled in `nginx.conf`.

### Issue B: Microphone Permission Denied in Studio
- **Cause**: Browser blocked audio input or non-HTTPS origin.
- **Solution**: Web Audio API requires HTTPS origin in production. Ensure SSL certificate is installed on Nginx/Vercel.

### Issue C: MongoDB Connection Timeout
- **Cause**: IP restriction on MongoDB Atlas cluster.
- **Solution**: Add server host IP to MongoDB Atlas Network Access whitelist.
