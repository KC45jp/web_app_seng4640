# Test Report

## Initial Testing

Initial testing was conducted in the local development environment. The backend
was run locally against the local database, and JMeter was used to validate the
checkout workflow under controlled conditions. The purpose of this stage was to
confirm basic correctness before running tests in the staging environment.

The local tests were used to verify that:

- seeded customer accounts could log in successfully
- the checkout flow created orders correctly
- carts were cleared after successful checkout
- overselling did not occur when multiple users attempted checkout at the same time

This stage also helped refine the test procedure. The JMeter workflow was updated
so that users completed the login burst before the checkout burst, and the staging
reset process was standardized to avoid stale carts from previous runs.

## Final Testing

Final testing was conducted against the staging deployment running on EC2 with
k3s. JMeter was executed from a local machine and targeted the staging backend
through the exposed NodePort service. This stage was intended to provide stronger
evidence that the proposed design met the project objectives under a more realistic
deployment setup.

The final tests focused on:

- correctness of flash-sale checkout under contention
- prevention of overselling
- consistency between stock reduction, order creation, and cart clearing
- response-time behavior under larger concurrent bursts

## Suggested Evidence Table

| Objective | Test Method | Success Criteria | Result | Conclusion |
| --- | --- | --- | --- | --- |
| Prevent overselling during flash sale | JMeter concurrent checkout test | Successful purchases must not exceed available stock | To be completed | To be completed |
| Maintain order and cart consistency | Database inspection after checkout | Each successful checkout creates an order and clears the cart | To be completed | To be completed |
| Support concurrent customer login | JMeter login burst | Valid seeded users can log in successfully | To be completed | To be completed |
| Maintain responsiveness under load | JMeter staging test | Requests should complete within the defined timeout window | To be completed | To be completed |

## Notes

- Local load-testing procedure: [load-testing.md](/home/keishi/tru/web_seng4640/web_app_seng4640/doc/operation/load-testing.md)
- Flash-sale load-testing summary: [flash-sale-load-testing-summary.md](/home/keishi/tru/web_seng4640/web_app_seng4640/doc/operation/flash-sale-load-testing-summary.md)
- Final project report draft: [SENG 4640 - Final Project.md](/home/keishi/tru/web_seng4640/web_app_seng4640/doc/other/SENG%204640%20-%20Final%20Project.md)
