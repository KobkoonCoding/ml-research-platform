import React from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import ModelTraining from './ModelTraining'

export default function TrainPage({ module = 'neural' }) {
  const { neural, forensic, setNeuralData, setForensicData } = useApp()
  const navigate = useNavigate()

  // Select slice based on module
  const isForensic = module === 'forensic'
  const data = isForensic ? forensic : neural
  const setData = isForensic ? setForensicData : setNeuralData

  if (!data?.analysis) {
    navigate(`/${module}/upload`)
    return null
  }

  return (
    <ModelTraining
      module={module}
      analysis={data.analysis}
      pipeline={data.pipeline || []}
      initialTarget={data.targetColumn}
      onTargetChange={(val) => setData({ targetColumn: val })}
      trainingResults={data.trainingResults}
      setTrainingResults={(res) => setData({ trainingResults: res })}
      trainingConfig={data.trainingConfig}
      setTrainingConfig={(conf) => {
        if (typeof conf === 'function') {
           setData({ trainingConfig: conf(data.trainingConfig) })
        } else {
           setData({ trainingConfig: { ...data.trainingConfig, ...conf } })
        }
      }}
      inferenceModel={data.inferenceModel}
      setInferenceModel={(inf) => setData({ inferenceModel: inf })}
    />
  )
}
