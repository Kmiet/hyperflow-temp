# How to run SoyKB with Scheduling

Use `kubectl cp ...` to move `cpuMap` and `execTimes` config files to hyperflow work_dir.
Use `kubectl cp ...` to move `k8sCommand` and `k8sJobSubmit` functions to hyperflow functions dir.
Then Copy plugin directory to engine pod, install it with `npm` and you are ready to go!