import torch
import cv2
import numpy as np
from timm.models.efficientnet import tf_efficientnet_b4_ns
from torch import nn
from torch.nn.modules.dropout import Dropout
from torch.nn.modules.linear import Linear
from torch.nn.modules.pooling import AdaptiveAvgPool2d

class DeepFakeClassifier(nn.Module):
    def __init__(self, dropout_rate=0.0) -> None:
        super().__init__()
        self.encoder = tf_efficientnet_b4_ns(pretrained=True, drop_path_rate=0.5)
        self.avg_pool = AdaptiveAvgPool2d((1, 1))
        self.dropout = Dropout(dropout_rate)
        self.fc = Linear(1792, 1)  # 1792 is the feature size for b4_ns

    def forward(self, x):
        x = self.encoder.forward_features(x)
        x = self.avg_pool(x).flatten(1)
        x = self.dropout(x)
        x = self.fc(x)
        return x

model = DeepFakeClassifier()
model.eval()

def preprocess_image(file_path):
    img = cv2.imread(file_path)
    if img is None:
        raise ValueError(f"Could not read image file: {file_path}. Unsupported format or corrupted file.")
    img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    img = cv2.resize(img, (224, 224))
    img = img.astype(np.float32) / 255.0
    img = (img - [0.485, 0.456, 0.406]) / [0.229, 0.224, 0.225]
    img = np.transpose(img, (2, 0, 1))
    img = np.expand_dims(img, 0)
    img = torch.tensor(img, dtype=torch.float)
    return img

def detect_deepfake(file_path: str):
    try:
        img = preprocess_image(file_path)
        with torch.no_grad():
            output = model(img)
            prob = torch.sigmoid(output).item()
            is_deepfake = 1 if prob > 0.5 else 0
        return is_deepfake, float(prob)
    except Exception as e:
        print(f"[ERROR] Deepfake detection failed: {e}")
        # Return a clear error result (not deepfake, zero confidence)
        return 0, 0.0 