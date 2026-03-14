import re

with open('/etc/nginx/sites-enabled/forbasi.or.id') as f:
    content = f.read()

# Remove old broken webhook blocks
content = re.sub(r'    location = /webhook \{[^}]+\}\n\n', '', content)
content = re.sub(r'    location = /webhook/ping \{[^}]+\}\n\n', '', content)

# Insert correct webhook blocks before 'location /api/'
webhook = '''    location = /webhook {
        proxy_pass http://127.0.0.1:9001/webhook;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Content-Type $content_type;
    }

    location = /webhook/ping {
        proxy_pass http://127.0.0.1:9001/webhook/ping;
        proxy_set_header Host $host;
    }

'''
content = content.replace('    location /api/ {', webhook + '    location /api/ {')

with open('/etc/nginx/sites-enabled/forbasi.or.id', 'w') as f:
    f.write(content)
print('Config updated')
