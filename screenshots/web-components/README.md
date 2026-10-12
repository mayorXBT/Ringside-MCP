# Web component comparison

Captured at 1280px and 390px on 12 October 2026. The signed-in `/app` captures use the **same local mock devnet owner state** before and after; they do not show a real account or transaction. The temporary mock route was removed before the final build. Landing and public-route captures use the production build with no mocked API response.

| Changed area | 1280px before | 1280px after | 390px before | 390px after |
|---|---|---|---|---|
| Hero text + stat pill | [Before](before/zero-hero-1280.png) | [After](after/zero-hero-1280.png) | [Before](before/zero-hero-390.png) | [After](after/zero-hero-390.png) |
| How it works steps | [Before](before/zero-how-1280.png) | [After](after/zero-how-1280.png) | [Before](before/zero-how-390.png) | [After](after/zero-how-390.png) |
| Owner overview + status | [Before](before/mock-overview-1280.png) | [After](after/mock-overview-1280.png) | [Before](before/mock-overview-390.png) | [After](after/mock-overview-390.png) |
| Signed policy button | [Before](before/mock-policy-1280.png) | [After](after/mock-policy-1280.png) | [Before](before/mock-policy-390.png) | [After](after/mock-policy-390.png) |
| Withdraw amount field | [Before](before/mock-withdraw-1280.png) | [After](after/mock-withdraw-1280.png) | [Before](before/mock-withdraw-390.png) | [After](after/mock-withdraw-390.png) |

[Full landing before](before/landing-1280.png) · [Full landing after](after/landing-1280.png) · [Public `/app` before](before/app-1280.png) · [Public `/app` after](after/app-1280.png) · [Demo before](before/demo-1280.png) · [Demo after](after/demo-1280.png)

The status, button, toast, and number motion lasts 220–280ms; static captures show the settled state. Skeleton and toast states are transient and were checked in the component implementation and browser pass, rather than represented as persistent screenshots.
