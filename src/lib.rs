extern crate ndarray;
extern crate console_error_panic_hook;
use ndarray::{Array1, Array2, ShapeError};
use serde::{Deserialize, Serialize};
use std::{error::Error, panic};
use wasm_bindgen::prelude::*;

fn sigmoid(x: f32) -> f32 {
    1.0 / (1.0 + (-x).exp())
}

#[derive(Debug, Clone)]
enum Layer {
    DenseLayer {
        weights: Array2<f32>,
        biases: Array1<f32>,
    },
    Sigmoid,
    Softmax,
    Tanh,
}

impl Layer {
    fn forward(&self, inputs: &Array1<f32>) -> Array1<f32> {
        match self {
            Self::DenseLayer {
                weights, biases, ..
            } => weights.dot(inputs) + &*biases,
            Self::Sigmoid => inputs.mapv(sigmoid),
            Self::Softmax => {
                let tmp = inputs.mapv(f32::exp);
                let sum = tmp.sum();
                tmp / sum
            },
            Self::Tanh => inputs.mapv(|x| x.tanh())
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
enum LayerData {
    Sigmoid,
    Softmax,
    Tanh,
    DenseLayer {
        weights: Vec<f32>,
        biases: Vec<f32>,
        num_inputs: usize,
        num_outputs: usize,
    },
}

impl TryFrom<LayerData> for Layer {
    type Error = ShapeError;
    fn try_from(value: LayerData) -> Result<Self, Self::Error> {
        let layer = match value {
            LayerData::Sigmoid => Layer::Sigmoid,
            LayerData::Softmax => Layer::Softmax,
            LayerData::Tanh => Layer::Tanh,
            LayerData::DenseLayer {
                weights,
                biases,
                num_inputs,
                num_outputs,
            } => Layer::DenseLayer {
                weights: Array2::from_shape_vec((num_outputs, num_inputs), weights)?,
                biases: Array1::from_vec(biases),
            },
        };
        Ok(layer)
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct NeuralNetworkData {
    layers: Vec<LayerData>,
    accuracy: f32,
}

#[derive(Debug, Clone)]
struct NeuralNetwork {
    layers: Vec<Layer>,
}

impl NeuralNetwork {
    fn forward(&self, input: Array1<f32>) -> Array1<f32> {
        let mut output = input;
        for layer in self.layers.iter() {
            output = layer.forward(&output);
        }
        output
    }

    fn load() -> Result<Self, Box<dyn Error>> {
        let string = include_str!("../data.json");
        let data: NeuralNetworkData = serde_json::from_str(&string)?;
        Ok(data.try_into()?)
    }
}

impl TryFrom<NeuralNetworkData> for NeuralNetwork {
    type Error = ShapeError;
    fn try_from(value: NeuralNetworkData) -> Result<Self, Self::Error> {
        let layers: Result<Vec<Layer>, ShapeError> =
            value.layers.into_iter().map(|x| x.try_into()).collect();
        Ok(NeuralNetwork {
            layers: layers?,
        })
    }
}

#[wasm_bindgen]
pub fn predict(image: Vec<f32>) -> Vec<f32> {
    panic::set_hook(Box::new(console_error_panic_hook::hook));
    
    let neural_netwrok = NeuralNetwork::load().unwrap();
    neural_netwrok.forward(Array1::from_vec(image)).to_vec()
}
