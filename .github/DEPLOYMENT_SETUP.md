# Auto-Retry Deployment Setup Guide

This workflow automatically retries failed Cloudflare Pages deployments and sends email notifications if the retry also fails.

## Prerequisites

- Public GitHub repository (free GitHub Actions)
- Cloudflare Pages connected to your repo
- Resend account for email notifications

---

## Option 1: Resend (Recommended)

Resend is simpler - just 1 API key instead of 5 SMTP credentials.

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up (free tier: 3,000 emails/month)

### Step 2: Verify Your Domain

1. In Resend dashboard, go to **Domains**
2. Add your domain (e.g., `emberbright.studio`)
3. Add the DNS records Resend provides
4. Wait for verification (usually a few minutes)

### Step 3: Create API Key

1. Go to **API Keys** in Resend dashboard
2. Click **Create API Key**
3. Name it (e.g., "GitHub Actions")
4. Copy the key (starts with `re_`)

### Step 4: Add Secret to GitHub Repo

1. Go to your repo on GitHub
2. Click **Settings** > **Secrets and variables** > **Actions**
3. Click **New repository secret**
4. Name: `RESEND_API_KEY`
5. Value: paste your API key
6. Click **Add secret**

### Step 5: Add Site URL Variable

1. Same settings page, click **Variables** tab
2. Click **New repository variable**
3. Name: `SITE_URL`
4. Value: `https://your-site.pages.dev` (your Cloudflare Pages URL)
5. Click **Add variable**

---

## Option 2: SMTP (Alternative)

If you prefer SMTP, you'll need to modify the workflow and add these 5 secrets:

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `SMTP_HOST` | SMTP server address | `smtp.gmail.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_USERNAME` | Email account | `your-email@gmail.com` |
| `SMTP_PASSWORD` | App-specific password | Generated in email settings |
| `SMTP_FROM` | Sender address | `noreply@yourdomain.com` |

### Gmail SMTP Setup

1. Enable 2FA on your Google account
2. Go to Google Account > Security > App passwords
3. Generate a new app password for "Mail"
4. Use `smtp.gmail.com` port `587`

### Workflow Changes for SMTP

Replace the email step in `auto-retry-deploy.yml`:

```yaml
- name: Send failure notification
  if: steps.verify.outputs.deployed == 'false'
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: ${{ secrets.SMTP_HOST }}
    server_port: ${{ secrets.SMTP_PORT }}
    username: ${{ secrets.SMTP_USERNAME }}
    password: ${{ secrets.SMTP_PASSWORD }}
    subject: "Deployment failed: ${{ github.repository }}"
    to: support@emberbright.studio
    from: ${{ secrets.SMTP_FROM }}
    body: |
      Cloudflare deployment failed after automatic retry.

      Repository: ${{ github.repository }}
      Site: ${{ env.SITE_URL }}
      Commit: ${{ github.sha }}
```

---

## Setting Up Additional Repos

For each new repo:

1. Copy `.github/workflows/auto-retry-deploy.yml` to the repo
2. Add the same `RESEND_API_KEY` secret
3. Add the repo-specific `SITE_URL` variable

The same Resend API key works across all repos.

---

## How It Works

1. When you push to `blog/posts/**`, the workflow waits 3 minutes for Cloudflare
2. It compares the live `posts.json` to your repo version
3. If they don't match, it creates an empty commit to trigger a retry
4. If the retry also fails, you get an email notification

---

## Customization

### Change Notification Email

Edit `NOTIFY_EMAIL` in the workflow file:

```yaml
env:
  NOTIFY_EMAIL: your-email@example.com
```

### Change Wait Time

Edit the sleep duration (in seconds):

```yaml
- name: Wait for Cloudflare deployment
  run: sleep 180  # 3 minutes
```
