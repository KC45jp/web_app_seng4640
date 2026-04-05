# Environmental, Societal, Safety, and Economic Considerations + Limitations

This section discusses how the design of the SENG 4640 e-commerce prototype
considered environmental, societal, safety, and economic factors. Because this
project is a student prototype rather than a commercial production system, the
design emphasis was on reducing technical and operational risk while staying
within strict budget and time constraints. The team therefore favored a simple,
traceable architecture built from open-source software, small-scale cloud or
free-tier infrastructure, and reusable development hardware instead of a
heavier multi-service commercial deployment.

## Safety Analysis

In a software system such as this one, "safety" mainly refers to prevention of
harm caused by incorrect transactions, unauthorized access, data leakage,
operator error, and unstable deployment behavior. The most important hazard in
this project was overselling during a flash sale, because it could lead to
customer disputes, incorrect orders, and financial inconsistency. Other major
hazards included unauthorized administrative actions, unsafe file uploads,
misconfigured staging or load-testing procedures, and accidental exposure of
sensitive configuration values.

### Hazards, Risks, and Mitigations

| Hazard | Possible consequence | Current mitigation in the design | Remaining risk |
| --- | --- | --- | --- |
| Concurrent checkout against the same product stock | Overselling, invalid orders, customer disputes | MongoDB transaction, conditional stock decrement, cart version check, retry handling for transient conflicts | Response time can still degrade under high contention even when correctness is preserved |
| Unauthorized access to customer or admin functions | Account misuse, product tampering, manager-account abuse | JWT-based authentication, role-based access control, hashed passwords with bcrypt, server-side request validation | Prototype still needs stronger production-grade secret handling and broader security hardening |
| Invalid or oversized image upload | Storage abuse, degraded backend performance, broken product pages | Restricted upload types, resize processing, processed-size limit, unique filenames, backend-controlled retrieval | Image handling is safer than raw uploads but still not a full enterprise media pipeline |
| Operator error during flash-sale setup or repeated load tests | Incorrect test results, stale carts, inconsistent staging state | Reset scripts, load-testing runbook, dedicated load-test seed flow, health/readiness endpoints | Human error is still possible if the runbook is skipped |
| Exposure of sensitive data or secrets | Privacy breach, service compromise | Environment-based configuration, masked Mongo URI in development readiness output, no real card number storage in checkout flow | Prototype secret management should be strengthened before production use |
| Single-node deployment or service outage | Temporary unavailability during testing or demos | Lightweight health and readiness endpoints, clear staging workflow, small operational scope | The prototype is not highly available and does not provide full redundancy |

### Accidents and Protection of Humans and Property

Although this project does not control physical machinery, software accidents
can still harm people and property indirectly. For example, an oversell bug can
charge customers for items that should not have been sold; an authorization bug
can let the wrong user modify products or accounts; and an operational mistake
can corrupt test evidence or weaken trust in the system. The design protects
users and project assets in several ways.

First, the checkout path prioritizes inventory correctness over maximum speed.
This design choice helps guard customers from receiving false purchase success
messages when stock is already exhausted. Second, the system does not process or
store real credit-card details; it only accepts a payment method label such as
`credit_card` or `paypal`, which reduces the chance of exposing high-risk
financial data during the prototype phase. Third, authentication, password
hashing, and role separation help guard both customer data and the administrative
functions that affect the product catalog. Fourth, operational health checks and
repeatable reset scripts help guard the staging environment from avoidable
misconfiguration.

### Warnings and Training for Operators

The system should be accompanied by short operator instructions for managers,
admins, and anyone running deployment or load-testing tasks. Recommended
warnings and training points are:

- Replace all placeholder secrets before any public deployment.
- Do not use real payment card numbers in the prototype, because the system is
  not a certified payment platform.
- Restrict admin and manager accounts to authorized team members only.
- Verify `/api/ready` and database connectivity before a flash-sale demo or
  measurement run.
- Reset staging before repeated load tests so that stale carts do not distort
  results.
- Upload only supported image formats and keep product media within the project
  constraints.

## Societal Considerations

The design also considered societal impact, especially fairness, privacy,
usability, and responsible access control. The role model separates Guest,
Customer, Product Manager, and Super Admin responsibilities so that each class
of user can access only the functions appropriate to that role. This reduces
misuse and helps preserve trust in the platform. The system also allows Guests
to browse products without being forced to create an account first, which lowers
access barriers for casual users.

From a privacy perspective, the prototype intentionally avoids storing real
payment details and instead limits checkout input to a simulated payment method.
Passwords are hashed before storage, and product/media access is routed through
backend-controlled APIs. These are socially responsible choices for a student
project because they reduce the harm that could result from accidental data
exposure.

The project also considered accessibility and inclusion, at least at a basic
design level. Product images include `alt` text, the UI uses standard form
controls such as buttons and inputs, and the frontend is intended to work across
desktop and smaller screens. However, this remains a prototype, so a full WCAG
audit, formal keyboard-only evaluation, screen-reader testing, and multilingual
support would still be needed before claiming strong accessibility compliance.

## Economic Considerations

The main economic decision in this project was to keep the architecture simple
enough to satisfy the course requirements without introducing unnecessary paid
services or operational complexity. Several design choices were made primarily
for cost control:

- using open-source tools such as React, Vite, Express, MongoDB Community, k3s,
  Docker Compose, Jest, and JMeter
- reusing existing laptops and development environments instead of buying new
  hardware
- preferring a compact staging deployment in which frontend and backend shared
  one EC2 host, with the backend running under single-node k3s, potentially
  with more than one pod replica, and the frontend running as a separate
  Docker container on that same machine
- using a prototype-scale image-storage solution instead of adding a separate
  object-storage pipeline too early
- avoiding full commercial payment integration for the prototype

### Cost Table

The table below is written as a report-ready draft. Replace any provisional
`$0` values with exact billing amounts if your team actually paid for cloud
usage or another purchased item.

| Component / Resource | Source | Prototype cost used in report | Notes |
| --- | --- | --- | --- |
| Team laptops / development PCs | Reused existing personal or institutional hardware | $0 incremental | No new hardware was purchased specifically for this prototype |
| Backend staging compute | Existing student cloud allocation, free tier, or low-cost instance | $0 to low cost `[replace with actual amount if billed]` | Used for deployed testing and demo only |
| Database hosting | Local Docker Compose and/or free/shared database tier | $0 direct `[replace if billed]` | Chosen to avoid a paid production database cluster during prototyping |
| Frontend toolchain | Open-source | $0 | React, Vite, TypeScript, React Router, Zustand |
| Backend toolchain | Open-source | $0 | Express, Mongoose, JWT libraries, bcrypt, Multer, Sharp |
| DevOps / testing tools | Open-source | $0 | Docker Compose, k3s, Jest, JMeter |
| Domain name / premium managed services | Not purchased for the prototype | $0 | The prototype prioritized function over branded deployment |
| Total direct purchased components | — | Approximately $0 or very low `[replace with actual total]` | The design remained within student-project budget constraints |

### Source of the Other Components

Most non-purchased components came from the open-source software ecosystem or
from already available infrastructure. The code depends heavily on community
maintained packages and frameworks, while the deployment/testing side relies on
reused computers, existing internet access, and small-scale prototype hosting.
This matters for the next section because it means the project's life cycle is
dominated less by newly purchased equipment and more by the use pattern of
existing hardware and cloud resources.

## Life Cycle and Environmental Impact Analysis

The environmental footprint of this project comes mainly from electricity use by
developer laptops, staging compute resources, database/storage activity, and
network transfer during testing and deployment. Because the project is software,
its environmental impact is lower than that of a hardware-heavy design, but it
is not zero. Continuous cloud uptime, repeated load testing, and large media
files can all increase energy use and resource consumption.

The prototype attempted to reduce these impacts by limiting system scope and
avoiding unnecessary infrastructure. The deployment strategy avoided a larger
always-on multi-node platform by keeping staging on a single EC2 instance:
backend ran under single-node k3s, even if multiple backend pod replicas were
used operationally, while the frontend ran as a separate Docker container on
the same host. Image uploads are resized and constrained, which lowers storage
use and data transfer. Open-source software was reused instead of purchasing
proprietary tools, and existing development laptops were reused instead of
introducing dedicated new hardware. In short, the design sought to deliver
required functionality with the smallest practical footprint for a student
project.

### 3Rs Analysis: Reduce, Reuse, Recycle

| Principle | Application in this project |
| --- | --- |
| Reduce | Reduced infrastructure complexity by focusing on a compact backend deployment, reducing oversized media through image resizing, and limiting the project to a prototype-scale architecture |
| Reuse | Reused existing laptops, open-source frameworks, community tooling, existing local/staging infrastructure, and reusable seed/load-test scripts |
| Recycle | Decommissioning plan should include deleting unused cloud resources, clearing stale test artifacts, removing inactive accounts, and recycling or institutionally disposing of any hardware at end of life |

### How the Design Lessens Negative Impact

The design reduces negative environmental impact mainly through restraint. It
does not deploy a large distributed production environment, does not require
specialized hardware purchases, and does not store unnecessarily large media
objects. The choice to keep staging on one EC2 host and to use single-node k3s
for the backend reduces infrastructure sprawl during the prototype phase, even
though it also limits redundancy. The choice to keep the frontend lightweight
and to limit image sizes improves performance while also reducing storage and
transfer costs. The use of scripted seeding and reset flows also prevents
repeated manual misconfiguration, which can waste time and compute resources.

### Recommendations to Reduce Environmental Impact Further

The following recommendations would reduce environmental impact during
construction, implementation, operation, and decommissioning:

- shut down staging resources when they are not being used
- delete stale load-test artifacts and unused uploaded images
- keep media assets compressed and appropriately sized
- avoid over-provisioning cloud resources for a prototype
- document teardown procedures so that temporary infrastructure is not left
  running after the course ends
- prefer managed or shared services only when they reduce total operational
  waste compared with self-hosting

## Limitations

Like any prototype, this design has important limitations.

First, the system was built under strong time and budget constraints, so it
optimizes for correctness and demonstrability rather than full production
readiness. The checkout path successfully prioritizes oversell prevention, but
load testing showed that responsiveness degrades under stronger contention even
when correctness is preserved. Second, the prototype uses simplified payment
handling and does not integrate a real payment gateway, which is safer for the
course project but also means the economic and security model is incomplete.

Third, accessibility and privacy have been considered but not fully validated.
The frontend includes some good baseline practices, but a full WCAG audit,
formal privacy notice, consent workflow, and legal compliance review are still
outside the current scope. Fourth, the deployment is intentionally simple:
frontend and backend share one EC2 host, the backend runs on single-node k3s,
and the system therefore remains dependent on one machine even if multiple pod
replicas are used. This means it does not provide production-grade redundancy,
auto-scaling, or strong fault isolation between services. Finally, some project
costs are minimized by relying on open-source software and already available
infrastructure, which is appropriate for a
student prototype but not always representative of a commercial deployment.

## Internal References Used for This Draft

- `doc/other/requirements.md`
- `doc/backend/backend_required_apis.md`
- `doc/backend/checkout-concurrency.md`
- `doc/backend/gridfs-image-storage.md`
- `doc/testing/test_report.md`
- `doc/operation/load-testing.md`
- `doc/operation/flash-sale-load-testing-summary.md`
- `.doc/operation/k8s-guide.md`
- `.doc/operation/aws-k3s-notes.md`

## Final Cleanup Notes Before Submission

- Replace provisional cost figures with exact billed amounts if your team paid
  for any cloud resources.
- If your instructor wants formal citations in IEEE style, convert the internal
  references above plus any external cloud/pricing/sustainability sources into
  the final bibliography.
- If you want, this draft can be shortened further for the report body and moved
  partly into an appendix.
