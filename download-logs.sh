ENGINE_POD_NAME=hyperflow-engine-59dd974fd8-drzmz
WF_ID=1
EXP_NAME=experiment-$WF_ID

# kubectl cp $ENGINE_POD_NAME:/work_dir/parsed ./soykbData/$EXP_NAME &&
# kubectl cp $ENGINE_POD_NAME:/work_dir/scheduler_workflow_plan_${WF_ID}_HEFT.json ./soykbData/$EXP_NAME/scheduler_workflow_plan.json &&
# kubectl cp $ENGINE_POD_NAME:/work_dir/scheduler_workflow_plan_${WF_ID}_PEFT.json ./soykbData/$EXP_NAME/scheduler_workflow_plan.json &&
# kubectl cp $ENGINE_POD_NAME:/work_dir/scheduler_task_data_$WF_ID.experiment ./soykbData/$EXP_NAME/scheduler_task_data.experiment

kubectl cp $ENGINE_POD_NAME:/work_dir/parsed ./montageData/$EXP_NAME &&
kubectl cp $ENGINE_POD_NAME:/work_dir/scheduler_workflow_plan_${WF_ID}_HEFT.json ./montageData/$EXP_NAME/scheduler_workflow_plan.json &&
kubectl cp $ENGINE_POD_NAME:/work_dir/scheduler_workflow_plan_${WF_ID}_PEFT.json ./montageData/$EXP_NAME/scheduler_workflow_plan.json &&
kubectl cp $ENGINE_POD_NAME:/work_dir/scheduler_task_data_$WF_ID.experiment ./montageData/$EXP_NAME/scheduler_task_data.experiment