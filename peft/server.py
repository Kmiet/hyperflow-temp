from flask import Flask, request
from peft import peft
import sys
import csv
import numpy as np
app = Flask(__name__)

def write_files(payload):
    cpuMatrix = payload['cpuMatrix']
    dagMatrix = payload['dagMatrix']
    timeMatrix = payload['timeMatrix']

    with open('execTimes.csv', 'w') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(timeMatrix)

    with open('dag.csv', 'w') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(dagMatrix)

    with open('resources.csv', 'w') as csvfile:
        writer = csv.writer(csvfile)
        writer.writerows(cpuMatrix)




@app.route('/', methods=['POST'])
def schedule_dag():
    payload = request.get_json()
    write_files(payload)
    comp_matrix_1 = peft.readCsvToNumpyMatrix('./execTimes.csv')
    comm_matrix_1 = peft.readCsvToNumpyMatrix('./resources.csv')
    dag1 = peft.readDagMatrix('./dag.csv')

    sched, _, _ = peft.schedule_dag(dag1, communication_matrix=comm_matrix_1, computation_matrix=comp_matrix_1)
    return {
        "sched": sched,
    }

if __name__ == "__main__":
    app.run(host='0.0.0.0')