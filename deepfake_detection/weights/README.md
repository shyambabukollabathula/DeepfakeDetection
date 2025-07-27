# Model Weights Directory

This directory should contain your trained deepfake detection model weights.

## Required File
- `df_model1.pth` - The trained EfficientNet-B4 model weights

## How to Get Model Weights

1. **Train your own model** using the EfficientNet-B4 architecture defined in `deepfake_detector.py`
2. **Download pre-trained weights** from a trusted source
3. **Use transfer learning** from existing deepfake detection models

## Without Model Weights

If no weights file is present, the application will still run but will use an untrained model, which means:
- Results will be essentially random
- The model needs to be trained on a deepfake detection dataset
- Confidence scores will not be meaningful

## Model Architecture

The model uses:
- **Base**: EfficientNet-B4 (tf_efficientnet_b4_ns)
- **Features**: 1792 feature dimensions
- **Output**: Single sigmoid output for binary classification
- **Dropout**: Configurable dropout rate (default: 0.0)

Place your trained `df_model1.pth` file in this directory to enable proper deepfake detection.