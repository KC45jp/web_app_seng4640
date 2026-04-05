# Test Report

## Initial Testing

Initial testing was conducted in the local development environment.

- Setup:
  The backend was run locally with `npm`, the database was run in Docker, and
  JMeter was used to validate the checkout workflow under controlled conditions.
- Purpose:
  Confirm basic correctness before running tests in the staging environment.

The local tests were used to verify the following:

- seeded customer accounts could log in successfully
- the checkout flow created orders correctly
- carts were cleared after successful checkout
- overselling did not occur when multiple users attempted checkout at the same time

- Improvements made during initial testing:
  The JMeter workflow was updated so that users completed the login burst before
  the checkout burst.
- Improvements made during initial testing:
  The staging reset process was standardized to avoid stale carts from previous
  runs.

- Representative local result:
  A JMeter run used `250` concurrent users and produced `500` total samples
  (`250` login requests and `250` checkout requests) with `0` errors.
- Local timing result:
  Average login time was `6804.60 ms`, and average checkout time was
  `15298.07 ms`.
- Local timing result:
  Maximum login time was `13382 ms`, and maximum checkout time was `21820 ms`.
- Initial testing conclusion:
  These results were considered acceptable for local validation and gave
  confidence that the checkout logic itself was functionally correct before
  moving to staging.

## Final Testing

Final testing was conducted against the staging deployment.

- Setup:
  JMeter was executed from a local machine and targeted the staging backend
  running on EC2.
- Purpose:
  Provide stronger evidence that the proposed design met the project objectives
  under a more realistic deployment setup.

The final tests focused on:

- correctness of flash-sale checkout under contention
- prevention of overselling
- consistency between stock reduction, order creation, and cart clearing
- response-time behavior under larger concurrent bursts

- Staging database condition:
  The staging environment used MongoDB Atlas Free Tier.
- 55-request scenario:
  In the `50 stock / 55 concurrent requests` scenario, the test completed
  successfully with no JMeter errors, and the 5 excess requests were treated as
  expected out-of-stock rejections.
- 110-request scenario:
  In the `100 stock / 110 concurrent requests` scenario, the average checkout
  time increased to more than `105 seconds`, with a maximum of about
  `168 seconds`.
- Responsiveness conclusion:
  This was considered unacceptable from a response-time perspective, even though
  overselling was still prevented.
- Tuning attempt:
  Changing the number of backend pods and adjusting the maximum MongoDB
  connection pool size did not materially improve the outcome.
- Infrastructure observation:
  EC2 CPU utilization did not exceed `7%` during the heavier staging tests.
- Interpretation:
  This suggests that the main bottleneck in staging was not raw CPU saturation,
  but more likely the combination of Atlas Free Tier limitations and high
  contention on the same stock record during checkout.
- Scope note:
  The local results discussed in the Initial Testing section were useful for
  method validation, but the final evidence table below focuses only on staging
  results because those were used as the final deployment-level validation.

## Final Testing Evidence Table

| Objective | Test Method | Success Criteria | Result | Conclusion |
| --- | --- | --- | --- | --- |
| Prevent overselling during flash sale | JMeter concurrent checkout test in staging | Successful purchases must not exceed available stock, and excess requests must be rejected cleanly | No oversell was observed in staging. The `50 stock / 55 requests` scenario completed with 5 expected out-of-stock rejections. The `100 stock / 110 requests` scenario also prevented oversell and treated 10 excess requests as out-of-stock results. | Passed for correctness |
| Maintain order and cart consistency | Database inspection after staging checkout | Each successful checkout creates an order and clears the cart | Successful staging checkouts produced orders and reduced stock consistently. Database inspection showed that completed checkout requests cleared carts as expected. | Passed |
| Support concurrent customer login | JMeter login burst in staging | Valid seeded users can log in successfully | In aligned staging runs, seeded users logged in successfully. For example, the `55-user` staging run recorded `Login 55 / 0 errors`, with an average of `3675.65 ms`. | Passed |
| Maintain responsiveness under load | JMeter staging test on Atlas Free Tier | Requests should complete within an acceptable timeout window and maintain acceptable response times under burst load | In staging, the `55-request` scenario completed without JMeter errors, but checkout time was already high at `31802.25 ms` average and `50090 ms` max. In the heavier `110-request` scenario, checkout reached `105670.35 ms` average, `116736 ms` median, `163100.40 ms` p90, and `168108 ms` max. Changing pod count and maximum connection pool size did not materially improve this, and EC2 CPU utilization did not exceed `7%` during the heavier tests. | Unacceptable in staging under heavier load; likely limited by database contention rather than raw CPU capacity |

## Notes

- Local load-testing procedure: [load-testing.md](/home/keishi/tru/web_seng4640/web_app_seng4640/doc/operation/load-testing.md)
- Flash-sale load-testing summary: [flash-sale-load-testing-summary.md](/home/keishi/tru/web_seng4640/web_app_seng4640/doc/operation/flash-sale-load-testing-summary.md)
- Final project report draft: [SENG 4640 - Final Project.md](/home/keishi/tru/web_seng4640/web_app_seng4640/doc/other/SENG%204640%20-%20Final%20Project.md)
