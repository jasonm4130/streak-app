# Terraform patch for `jasonm4130-cf`

This patch wires `streak.jasonmatthew.dev` to the `streak-app` Worker. Apply manually after `wrangler deploy` succeeds at least once (the Worker must exist before the custom-domain binding can attach).

## 1. Add CNAME in `dns_jasonmatthew_dev.tf`

Append the following resource to `dns_jasonmatthew_dev.tf`:

```hcl
# streak app — Cloudflare Worker with Static Assets
resource "cloudflare_dns_record" "jasonmatthew_dev_streak" {
  zone_id = var.zone_id_jasonmatthew_dev
  name    = "streak"
  type    = "CNAME"
  content = "streak-app.jasonm4130.workers.dev" # adjust if your Workers subdomain differs
  ttl     = 1 # auto
  proxied = true
  comment = "streak PWA (managed: workers custom domain)"
}
```

## 2. Add custom-domain binding in `workers.tf`

Append:

```hcl
# Binds streak.jasonmatthew.dev → streak-app Worker
resource "cloudflare_workers_custom_domain" "streak_app" {
  account_id = var.account_id
  hostname   = "streak.jasonmatthew.dev"
  service    = "streak-app"
  zone_id    = var.zone_id_jasonmatthew_dev
  environment = "production"
}
```

## 3. Apply

```bash
cd ~/Work/Git/jasonm4130-cf
terraform plan -out=streak-app.tfplan
terraform apply streak-app.tfplan
```

## 4. Verify

```bash
dig +short CNAME streak.jasonmatthew.dev
curl -I https://streak.jasonmatthew.dev/
```

Expected: 200 OK, HTML body with `<title>streak</title>`. The Worker custom-domain binding usually propagates within ~60 seconds.

## Rollback

```bash
terraform destroy -target=cloudflare_workers_custom_domain.streak_app \
                  -target=cloudflare_dns_record.jasonmatthew_dev_streak
```
